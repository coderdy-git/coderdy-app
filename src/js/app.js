import { createClient } from '@supabase/supabase-js';
import { initDB, addAttendance, getUnsyncedAttendances, markAsSynced, getLastAttendance, getAttendances, insertPulledAttendance, clearDB } from './db.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    experimental: { passkey: true }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.getElementById('google-btn');
  const btnText = googleBtn.querySelector('span');
  const spinner = googleBtn.querySelector('.spinner');
  const messageBox = document.getElementById('message-box');
  
  const passkeyLoginBtn = document.getElementById('passkey-login-btn');
  const passkeyLoginBtnText = passkeyLoginBtn.querySelector('span');
  const passkeyLoginSpinner = passkeyLoginBtn.querySelector('.spinner');
  
  const registerPasskeyBtn = document.getElementById('register-passkey-btn');
  
  const authPanel = document.getElementById('auth-panel');
  const dashboardPanel = document.getElementById('dashboard-panel');
  const profilePanel = document.getElementById('profile-panel');
  const attendancePanel = document.getElementById('attendance-panel');
  const attendanceBtn = document.getElementById('attendance-btn');
  const backFromAttendanceBtn = document.getElementById('back-from-attendance');
  const logoutBtn = document.getElementById('logout-btn');
  const profileBtn = document.getElementById('profile-btn');
  const backToDashBtn = document.getElementById('back-to-dash');
  const devClearDbBtn = document.getElementById('dev-clear-db-btn');
  
  // Attendance Settings Modal
  const attendanceSettingsBtn = document.getElementById('attendance-settings-btn');
  const attendanceSettingsModal = document.getElementById('attendance-settings-modal');
  const requestLeaveBtn = document.getElementById('request-leave-btn');
  const requestAnnualLeaveBtn = document.getElementById('request-annual-leave-btn');
  const requestHolidayBtn = document.getElementById('request-holiday-btn');
  const closeAttendanceSettingsBtn = document.getElementById('close-settings-modal-btn');
  
  attendanceSettingsBtn?.addEventListener('click', () => {
    attendanceSettingsModal?.classList.remove('hidden');
  });
  
  closeAttendanceSettingsBtn?.addEventListener('click', () => {
    attendanceSettingsModal?.classList.add('hidden');
  });
  
  function handleLeaveOrHoliday(type) {
    attendanceSettingsModal?.classList.add('hidden');
    executePunch(type);
  }

  requestLeaveBtn?.addEventListener('click', () => {
    handleLeaveOrHoliday('Sick Leave');
  });
  
  requestAnnualLeaveBtn?.addEventListener('click', () => {
    handleLeaveOrHoliday('Leave');
  });
  
  requestHolidayBtn?.addEventListener('click', () => {
    handleLeaveOrHoliday('Holiday');
  });
  
  // Logout Modal elements
  const logoutModal = document.getElementById('logout-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  
  // Overtime Modal elements
  const overtimeModal = document.getElementById('overtime-modal');
  const overtimeCancelBtn = document.getElementById('overtime-cancel-btn');
  const overtimeConfirmBtn = document.getElementById('overtime-confirm-btn');
  
  const defaultAvatar = document.getElementById('default-avatar');
  const userAvatar = document.getElementById('user-avatar');
  const profileDefaultAvatar = document.getElementById('profile-default-avatar');
  const profileAvatarLarge = document.getElementById('profile-avatar-large');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const punchBtn = document.getElementById('punch-btn');
  let currentSessionUser = null;
  
  const mainBottomNav = document.getElementById('main-bottom-nav');

  // Check Passkey Support
  if (!window.PublicKeyCredential) {
    if (passkeyLoginBtn) passkeyLoginBtn.style.display = 'none';
  }

  // Initialize Offline SQLite Database
  initDB().then(() => {
    // Check current session on load after DB is ready
    checkSession();
  });

  // Supabase usually redirects with hash after OAuth login.
  // getSession handles this automatically.
  async function checkSession() {
    // Manually parse OAuth error from hash if present
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get('error_description') || params.get('error');
      showToast('OAuth Error: ' + decodeURIComponent(errorDesc).replace(/\+/g, ' '), 'error');
      window.history.replaceState(null, '', window.location.pathname);
      resetBtn();
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        showToast('Login Error: ' + error.message, 'error');
        resetBtn();
      }
      
      if (session) {
        showDashboard(session.user);
      }
    } catch (e) {
      console.log('Error checking session', e);
      showToast('Login Error: ' + e.message, 'error');
      resetBtn();
    } finally {
      // Hide Splash Screen smoothly
      setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
          splash.style.opacity = '0';
          splash.style.visibility = 'hidden';
          setTimeout(() => splash.remove(), 500);
        }
      }, 500); // 500ms artificial delay for a premium feel
    }
  }

  // Listen for auth state changes (crucial for OAuth redirects)
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      showDashboard(session.user);
    } else if (event === 'SIGNED_OUT') {
      // Optional: force UI to login screen if not already
    }
  });

  googleBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // UI Loading state
    btnText.style.opacity = '0.5';
    spinner.classList.remove('hidden');
    googleBtn.disabled = true;
    messageBox.classList.add('hidden');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        showMessage(error.message, 'error');
        resetBtn();
      }
      // If successful, the page will redirect to Google's consent screen.
    } catch (err) {
      showMessage('Network error or configuration issue.', 'error');
      resetBtn();
    }
  });

  passkeyLoginBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    passkeyLoginBtnText.style.opacity = '0.5';
    passkeyLoginSpinner.classList.remove('hidden');
    passkeyLoginBtn.disabled = true;
    messageBox.classList.add('hidden');

    try {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) {
        showMessage(error.message, 'error');
      } else if (data?.session) {
        showDashboard(data.session.user);
      }
    } catch (err) {
      showMessage('Passkey login failed or cancelled.', 'error');
    }
    
    passkeyLoginBtnText.style.opacity = '1';
    passkeyLoginSpinner.classList.add('hidden');
    passkeyLoginBtn.disabled = false;
  });

  // Custom Toast System
  function showToast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; top: 25px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; width: 90%; max-width: 400px; align-items: center;';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    
    let icon = '';
    if (type === 'success') {
      icon = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else {
      icon = '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }
    
    toast.innerHTML = `${icon} <span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.3s ease forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  registerPasskeyBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const originalText = registerPasskeyBtn.innerHTML;
    registerPasskeyBtn.innerHTML = 'Registering...';
    registerPasskeyBtn.disabled = true;

    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        showToast('Failed to register passkey: ' + error.message, 'error');
        registerPasskeyBtn.innerHTML = originalText;
        registerPasskeyBtn.disabled = false;
      } else {
        showToast('Passkey successfully registered!', 'success');
        registerPasskeyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; margin-right: 10px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Passkey Enabled';
        registerPasskeyBtn.style.background = '#10b981';
        registerPasskeyBtn.disabled = true;
      }
    } catch (err) {
      showToast('Passkey registration cancelled or failed.', 'error');
      registerPasskeyBtn.innerHTML = originalText;
      registerPasskeyBtn.disabled = false;
    }
  });

  logoutBtn?.addEventListener('click', () => {
    logoutModal?.classList.remove('hidden');
  });
  
  devClearDbBtn?.addEventListener('click', async () => {
    // 1. GUARANTEE Local DB Deletion First
    await clearDB();
    
    try {
      if (!currentSessionUser) return;
      
      // 2. Delete from Supabase
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('user_id', currentSessionUser.id);
        
      if (error) {
        showToast('Supabase Delete Error: ' + error.message, 'error');
      }
    } catch (err) {
      showToast('Cloud error: ' + err.message, 'error');
    }
    
    // 3. Force refresh unconditionally
    showToast('All local data wiped. Reloading...', 'success');
    setTimeout(() => {
      window.location.reload();
    });
  });
  
  const devGenerateDummyBtn = document.getElementById('dev-generate-dummy-btn');
  devGenerateDummyBtn?.addEventListener('click', async () => {
    if (!currentSessionUser) return;
    
    if (!confirm('This will insert 50 random dummy records into the cloud database. Continue?')) return;
    
    devGenerateDummyBtn.disabled = true;
    devGenerateDummyBtn.innerHTML = '<div class="spinner" style="border-color: rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; width: 18px; height: 18px; position: relative; right: auto; margin-right: 10px;"></div> Generating...';
    
    try {
      const records = [];
      const types = ['Check In', 'Check Out', 'Check In (Overtime)', 'Check Out (Overtime)', 'Sick Leave', 'Holiday', 'Leave'];
      const now = new Date();
      
      for (let i = 0; i < 50; i++) {
        // Random time in the last 30 days
        const randomPastMs = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
        const randomDate = new Date(now.getTime() - randomPastMs);
        const type = types[Math.floor(Math.random() * types.length)];
        
        records.push({
          user_id: currentSessionUser.id,
          timestamp: randomDate.toISOString(),
          type: type
        });
      }
      
      const { error } = await supabase.from('attendances').insert(records);
      
      if (error) throw error;
      
      showToast('Successfully injected 50 dummy records! Pulling to local...', 'success');
      setTimeout(() => { window.location.reload(); }, 1500);
      
    } catch (err) {
      console.warn('Dummy insertion error', err);
      showToast('Error injecting dummy data', 'error');
    } finally {
      devGenerateDummyBtn.disabled = false;
      devGenerateDummyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; margin-right: 10px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> [Dev] Generate 50 Dummy Records';
    }
  });

  modalCancelBtn?.addEventListener('click', () => {
    logoutModal.classList.add('hidden');
  });

  modalConfirmBtn.addEventListener('click', async () => {
    modalConfirmBtn.innerHTML = '<div class="spinner" style="border-color: white; border-top-color: transparent;"></div>';
    await supabase.auth.signOut();
    
    logoutModal.classList.add('hidden');
    modalConfirmBtn.innerHTML = 'Sign Out';
    
    // UI state
    profilePanel.style.opacity = '0';
    dashboardPanel.style.opacity = '0';
    attendancePanel.style.opacity = '0';
    mainBottomNav?.classList.add('hidden');
    
    setTimeout(() => {
      profilePanel.classList.add('hidden');
      dashboardPanel.classList.add('hidden');
      attendancePanel.classList.add('hidden');
      reportPanel.classList.add('hidden');
      authPanel.classList.remove('hidden');
      authPanel.style.transform = 'scale(1)';
      authPanel.style.opacity = '1';
      messageBox.classList.add('hidden');
    }, 300);
  });

  const reportPanel = document.getElementById('report-panel');
  const navReport = document.getElementById('nav-report');
  const backToDashFromReport = document.getElementById('back-to-dash-from-report');
  const generateReportBtn = document.getElementById('generate-report-btn');
  const reportStartDate = document.getElementById('report-start-date');
  const reportEndDate = document.getElementById('report-end-date');
  const reportResultsList = document.getElementById('report-results-list');
  const reportFilterCard = document.getElementById('report-filter-card');
  const reportResetBtn = document.getElementById('report-reset-btn');
  
  const navItems = document.querySelectorAll('.nav-item');
  const navHome = document.getElementById('nav-home');
  const navProfileBottom = document.getElementById('nav-profile-bottom');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all
      navItems.forEach(nav => nav.classList.remove('active'));
      // Add active to clicked
      item.classList.add('active');
    });
  });
  
  navHome?.addEventListener('click', () => {
    profilePanel.style.opacity = '0';
    reportPanel.style.opacity = '0';
    setTimeout(() => {
      profilePanel.classList.add('hidden');
      reportPanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });
  
  backToDashFromReport?.addEventListener('click', () => {
    navReport?.classList.remove('active');
    navHome?.classList.add('active');
    reportPanel.style.opacity = '0';
    setTimeout(() => {
      reportPanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  navReport?.addEventListener('click', () => {
    dashboardPanel.style.opacity = '0';
    profilePanel.style.opacity = '0';
    setTimeout(() => {
      dashboardPanel.classList.add('hidden');
      profilePanel.classList.add('hidden');
      reportPanel.classList.remove('hidden');
      
      // Default empty state
      reportResultsList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Select dates to view report</p>';
      reportStartDate.value = '';
      reportEndDate.value = '';
      reportFilterCard.classList.remove('hidden');
      reportResetBtn.classList.add('hidden');
      
      setTimeout(() => { reportPanel.style.opacity = '1'; }, 50);
    }, 300);
  });
  
  generateReportBtn?.addEventListener('click', async () => {
    const start = reportStartDate.value;
    const end = reportEndDate.value;
    
    if (!start || !end) {
      showToast('Please select both start and end dates', 'error');
      return;
    }
    
    if (new Date(start) > new Date(end)) {
      showToast('Start date must be before end date', 'error');
      return;
    }
    
    if (!currentSessionUser) return;
    
    generateReportBtn.innerHTML = '<div class="spinner" style="border-color: rgba(255,255,255,0.2); border-top-color: white; width: 18px; height: 18px; position: relative; right: auto; margin-right: 8px;"></div> Generating...';
    generateReportBtn.disabled = true;
    reportResultsList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Loading report data...</p>';
    
    try {
      // Append time to ensure full day coverage
      const startDateTime = new Date(start + 'T00:00:00.000Z').toISOString();
      const endDateTime = new Date(end + 'T23:59:59.999Z').toISOString();
      
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', currentSessionUser.id)
        .gte('timestamp', startDateTime)
        .lte('timestamp', endDateTime)
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      
      reportResultsList.innerHTML = '';
      
      if (!data || data.length === 0) {
        reportResultsList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">No records found for selected dates.</p>';
      } else {
        const grouped = {};
        
        data.forEach(rec => {
          const dateObj = new Date(rec.timestamp);
          const dateKey = dateObj.toDateString();
          const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          
          if (!grouped[dateKey]) {
            grouped[dateKey] = {
              dateObj: dateObj,
              checkIn: '--:--',
              checkOut: '--:--',
              leaveType: null
            };
          }
          
          if (rec.type.includes('Check In')) {
            grouped[dateKey].checkIn = timeStr;
          } else if (rec.type.includes('Check Out')) {
            grouped[dateKey].checkOut = timeStr;
          } else {
            // Sick Leave, Leave, Holiday
            grouped[dateKey].leaveType = rec.type;
          }
        });
        
        const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        
        sortedKeys.forEach(key => {
          const dayData = grouped[key];
          const dObj = dayData.dateObj;
          const dayNum = dObj.getDate();
          const monthStr = dObj.toLocaleDateString('en-US', { month: 'short' });
          
          let rightSideHtml = '';
          
          if (dayData.leaveType) {
            // One card for leave/holiday
            rightSideHtml = `
              <div style="background: #fef3c7; color: #d97706; padding: 8px 15px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-left: 25px;">
                ${dayData.leaveType}
              </div>
            `;
          } else {
            // Check In / Check Out combined
            rightSideHtml = `
              <div style="display: flex; gap: 25px; align-items: center; margin-left: 25px;">
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                  <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">In</span>
                  <span style="font-size: 15px; color: #1e293b; font-weight: 600;">${dayData.checkIn}</span>
                </div>
                <div style="width: 1px; height: 30px; background: #e2e8f0;"></div>
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                  <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Out</span>
                  <span style="font-size: 15px; color: #1e293b; font-weight: 600;">${dayData.checkOut}</span>
                </div>
              </div>
            `;
          }
          
          const itemHtml = `
            <div style="display: flex; align-items: center; justify-content: flex-start; border-bottom: 1px solid #f1f5f9; padding: 15px; background: white;">
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; width: 50px; height: 50px; border-radius: 12px; border: 1px solid #e2e8f0; flex-shrink: 0;">
                <span style="font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1;">${dayNum}</span>
                <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">${monthStr}</span>
              </div>
              
              ${rightSideHtml}
            </div>
          `;
          
          reportResultsList.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        // Hide filter, show reset
        reportFilterCard.classList.add('hidden');
        reportResetBtn.classList.remove('hidden');
      }
      
    } catch (err) {
      console.warn("Report error:", err);
      showToast('Failed to generate report', 'error');
      reportResultsList.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:14px; padding:20px;">Failed to load report data.</p>';
    } finally {
      generateReportBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Generate Report';
      generateReportBtn.disabled = false;
    }
  });

  reportResetBtn?.addEventListener('click', () => {
    reportResultsList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Select dates to view report</p>';
    reportStartDate.value = '';
    reportEndDate.value = '';
    reportFilterCard.classList.remove('hidden');
    reportResetBtn.classList.add('hidden');
  });

  navProfileBottom?.addEventListener('click', () => {
    dashboardPanel.style.opacity = '0';
    reportPanel.style.opacity = '0';
    setTimeout(() => {
      dashboardPanel.classList.add('hidden');
      reportPanel.classList.add('hidden');
      profilePanel.classList.remove('hidden');
      setTimeout(() => { profilePanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  navHome?.addEventListener('click', () => {
    profilePanel.style.opacity = '0';
    setTimeout(() => {
      profilePanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  profileBtn.addEventListener('click', () => {
    // Sync nav bar
    navItems.forEach(nav => nav.classList.remove('active'));
    navProfileBottom?.classList.add('active');
    
    dashboardPanel.style.opacity = '0';
    setTimeout(() => {
      dashboardPanel.classList.add('hidden');
      profilePanel.classList.remove('hidden');
      setTimeout(() => { profilePanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  backToDashBtn.addEventListener('click', () => {
    // Sync nav bar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    document.getElementById('nav-home')?.classList.add('active');

    profilePanel.style.opacity = '0';
    setTimeout(() => {
      profilePanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });
  
  // Attendance Panel Logic
  let clockInterval;
  let currentAttendanceStatus = 'Check In';
  
  // Helper to dynamically update the state of the Punch Button
  function updatePunchButtonState(userId) {
    getAttendances(userId).then(records => {
      const punchText = punchBtn.querySelector('span');
      const iconSvg = punchBtn.querySelector('svg');
      const ripples = punchBtn.parentElement.querySelectorAll('div');
      
      const todayStr = new Date().toDateString();
      const todayRecords = records.filter(r => new Date(r.timestamp).toDateString() === todayStr);
      
      const hasCheckIn = todayRecords.some(r => r.type === 'Check In' || r.type === 'Check In (Overtime)');
      const hasCheckOut = todayRecords.some(r => r.type === 'Check Out' || r.type === 'Check Out (Overtime)');
      const hasLeave = todayRecords.some(r => r.type === 'Sick Leave' || r.type === 'Holiday' || r.type === 'Leave');
      
      if (hasCheckOut || hasLeave) {
        currentAttendanceStatus = 'Completed';
        punchBtn.disabled = true;
        punchBtn.style.background = '#cbd5e1'; // Greyed out
        punchBtn.style.opacity = '0.5';
        punchBtn.style.pointerEvents = 'none';
        if (punchText) punchText.innerText = 'Completed';
        
        // Disable settings buttons because attendance is completed
        if (requestLeaveBtn) { requestLeaveBtn.style.opacity = '0.5'; requestLeaveBtn.style.pointerEvents = 'none'; }
        if (requestAnnualLeaveBtn) { requestAnnualLeaveBtn.style.opacity = '0.5'; requestAnnualLeaveBtn.style.pointerEvents = 'none'; }
        if (requestHolidayBtn) { requestHolidayBtn.style.opacity = '0.5'; requestHolidayBtn.style.pointerEvents = 'none'; }
        
        if (iconSvg) iconSvg.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
        ripples.forEach(r => r.style.display = 'none');
      } else if (hasCheckIn) {
        currentAttendanceStatus = 'Check Out';
        punchBtn.disabled = false;
        punchBtn.style.background = 'linear-gradient(135deg, #f43f5e, #fb923c)';
        punchBtn.style.boxShadow = '0 15px 35px rgba(244, 63, 94, 0.4)';
        punchBtn.style.cursor = 'pointer';
        
        // Disable settings buttons because they shouldn't request leave after checking in
        if (requestLeaveBtn) { requestLeaveBtn.style.opacity = '0.5'; requestLeaveBtn.style.pointerEvents = 'none'; }
        if (requestAnnualLeaveBtn) { requestAnnualLeaveBtn.style.opacity = '0.5'; requestAnnualLeaveBtn.style.pointerEvents = 'none'; }
        if (requestHolidayBtn) { requestHolidayBtn.style.opacity = '0.5'; requestHolidayBtn.style.pointerEvents = 'none'; }
        if (punchText) punchText.innerText = 'Check Out';
        if (iconSvg) iconSvg.innerHTML = '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>';
        ripples.forEach(r => { r.style.display = 'block'; r.style.background = 'rgba(244, 63, 94, 0.1)'; });
      } else {
        currentAttendanceStatus = 'Check In';
        punchBtn.disabled = false;
        punchBtn.style.background = 'linear-gradient(135deg, #4f46e5, #3b82f6)';
        punchBtn.style.boxShadow = '0 15px 35px rgba(79, 70, 229, 0.4)';
        punchBtn.style.cursor = 'pointer';
        
        // Re-enable settings buttons
        if (requestLeaveBtn) { requestLeaveBtn.style.opacity = '1'; requestLeaveBtn.style.pointerEvents = 'auto'; }
        if (requestAnnualLeaveBtn) { requestAnnualLeaveBtn.style.opacity = '1'; requestAnnualLeaveBtn.style.pointerEvents = 'auto'; }
        if (requestHolidayBtn) { requestHolidayBtn.style.opacity = '1'; requestHolidayBtn.style.pointerEvents = 'auto'; }
        
        if (punchText) punchText.innerText = 'Check In';
        if (iconSvg) iconSvg.innerHTML = '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>';
        ripples.forEach(r => { r.style.display = 'block'; r.style.background = 'rgba(79, 70, 229, 0.1)'; });
      }
    }).catch(err => console.warn(err));
  }

  attendanceBtn?.addEventListener('click', () => {
    dashboardPanel.style.opacity = '0';
    mainBottomNav?.classList.add('hidden');
    
    // Check last attendance to toggle button state
    if (currentSessionUser) {
      updatePunchButtonState(currentSessionUser.id);
    }
    
    setTimeout(() => {
      dashboardPanel.classList.add('hidden');
      attendancePanel.classList.remove('hidden');
      setTimeout(() => { attendancePanel.style.opacity = '1'; }, 50);
      
      // Start Live Clock
      const liveClock = document.getElementById('live-clock');
      const liveDate = document.getElementById('live-date');
      
      function updateClock() {
        const now = new Date();
        liveClock.innerText = now.toLocaleTimeString('en-US', { hour12: false });
        liveDate.innerText = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
      
      updateClock();
      clockInterval = setInterval(updateClock, 1000);
      
    }, 300);
  });
  
  // Function to execute the actual database save
  function executePunch(statusToSave) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database Timeout. Please restart the app.')), 3000);
    });

    Promise.race([
      addAttendance(currentSessionUser.id, statusToSave),
      timeoutPromise
    ])
      .then(success => {
        if (success) {
          showToast(`${statusToSave} Success!`, 'success');
          syncAttendancesToSupabase();
          updatePunchButtonState(currentSessionUser.id);
          
          // Automatically return to dashboard
          attendancePanel.style.opacity = '0';
          if (clockInterval) clearInterval(clockInterval);
          setTimeout(() => {
            attendancePanel.classList.add('hidden');
            dashboardPanel.classList.remove('hidden');
            mainBottomNav?.classList.remove('hidden');
            
            // Sync bottom nav active state
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(nav => nav.classList.remove('active'));
            document.getElementById('nav-home')?.classList.add('active');
            
            if (currentSessionUser) renderRecentActivity(currentSessionUser.id);
            setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
          }, 300);
        } else {
          showToast('Failed to record attendance.', 'error');
        }
      })
      .catch(err => {
        showToast('Error: ' + err.message, 'error');
      });
  }

  punchBtn?.addEventListener('click', () => {
    if (!currentSessionUser) return;
    
    // 1. Instant Visual Feedback
    punchBtn.disabled = true;
    punchBtn.style.transform = 'scale(0.90)';
    punchBtn.style.opacity = '0.8';
    
    setTimeout(() => {
      punchBtn.disabled = false;
      punchBtn.style.transform = 'scale(1)';
      punchBtn.style.opacity = '1';
    }, 250);
    
    // 2. Overtime Interceptor
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6; // 0 = Sunday, 6 = Saturday
    
    if (currentAttendanceStatus === 'Check In' && isWeekend) {
      overtimeModal?.classList.remove('hidden');
      return; // Stop here, wait for modal
    }
    
    // 3. Normal execution (including Check Out on weekends)
    let finalStatus = currentAttendanceStatus;
    if (currentAttendanceStatus === 'Check Out' && isWeekend) {
      finalStatus = 'Check Out (Overtime)';
    }
    
    executePunch(finalStatus);
  });
  
  overtimeCancelBtn?.addEventListener('click', () => {
    overtimeModal?.classList.add('hidden');
  });
  
  overtimeConfirmBtn?.addEventListener('click', () => {
    overtimeModal?.classList.add('hidden');
    executePunch('Check In (Overtime)');
  });

  backFromAttendanceBtn?.addEventListener('click', () => {
    attendancePanel.style.opacity = '0';
    clearInterval(clockInterval);
    
    setTimeout(() => {
      attendancePanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      mainBottomNav?.classList.remove('hidden');
      if (currentSessionUser) renderRecentActivity(currentSessionUser.id);
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });
  
  // Attendance Settings Modal Logic
  attendanceSettingsBtn?.addEventListener('click', () => {
    attendanceSettingsModal?.classList.remove('hidden');
  });
  
  closeSettingsModalBtn?.addEventListener('click', () => {
    attendanceSettingsModal?.classList.add('hidden');
  });
  
  function recordAlternativeAttendance(type) {
    attendanceSettingsModal?.classList.add('hidden');
    if (!currentSessionUser) return;
    if (currentAttendanceStatus === 'Completed') {
      showToast('Attendance for today is already completed.', 'error');
      return;
    }
    
    addAttendance(currentSessionUser.id, type).then(success => {
      if (success) {
        showToast(`${type} Recorded Successfully!`, 'success');
        syncAttendancesToSupabase();
        updatePunchButtonState(currentSessionUser.id);
      } else {
        showToast(`Failed to record ${type}.`, 'error');
      }
    }).catch(err => showToast('Error: ' + err.message, 'error'));
  }
  
  requestLeaveBtn?.addEventListener('click', () => recordAlternativeAttendance('Sick Leave'));
  requestHolidayBtn?.addEventListener('click', () => recordAlternativeAttendance('Holiday'));

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `message-box ${type}`;
    messageBox.classList.remove('hidden');
  }

  function resetBtn() {
    btnText.style.opacity = '1';
    spinner.classList.add('hidden');
    googleBtn.disabled = false;
  }

  function showDashboard(user) {
    currentSessionUser = user;
    authPanel.style.transform = 'scale(0.9)';
    authPanel.style.opacity = '0';
    
    setTimeout(() => {
      authPanel.classList.add('hidden');
      profilePanel.classList.add('hidden');
      reportPanel.classList.add('hidden');
      attendancePanel.classList.add('hidden');
      
      dashboardPanel.classList.remove('hidden');
      mainBottomNav?.classList.remove('hidden');
      
      // Force navigation state to Home tab
      const navs = document.querySelectorAll('.nav-item');
      navs.forEach(nav => nav.classList.remove('active'));
      const homeNav = document.getElementById('nav-home');
      if (homeNav) homeNav.classList.add('active');
      
      // Admin check for Dev buttons
      const devClearBtn = document.getElementById('dev-clear-db-btn');
      const devDummyBtn = document.getElementById('dev-generate-dummy-btn');
      if (user.email === 'admin.coderdy@gmail.com') {
        devClearBtn?.classList.remove('hidden');
        devDummyBtn?.classList.remove('hidden');
      } else {
        devClearBtn?.classList.add('hidden');
        devDummyBtn?.classList.add('hidden');
      }
      
      // Role Badge Check
      const roleBadge = document.getElementById('header-role-badge');
      if (roleBadge) {
        if (user.email === 'admin.coderdy@gmail.com') {
          roleBadge.textContent = 'DEVELOPER';
          roleBadge.style.backgroundColor = '#dbeafe';
          roleBadge.style.color = '#1e3a8a';
          roleBadge.classList.remove('hidden');
        } else if (user.email && user.email.toLowerCase().includes('tester')) {
          roleBadge.textContent = 'TESTER';
          roleBadge.style.backgroundColor = '#fce7f3'; // light pink
          roleBadge.style.color = '#9d174d'; // dark pink
          roleBadge.classList.remove('hidden');
        } else {
          roleBadge.classList.add('hidden');
        }
      }
      
      // Check for existing passkeys
      if (window.PublicKeyCredential && supabase.auth.passkey) {
        supabase.auth.passkey.list().then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const btn = document.getElementById('register-passkey-btn');
            if (btn) {
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; margin-right: 10px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Passkey Enabled';
              btn.style.background = '#10b981';
              btn.disabled = true;
            }
          }
        });
      }
      
      // Animate in
      setTimeout(() => {
        dashboardPanel.style.opacity = '1';
      }, 50);
      
      // Try to get name or email from user metadata
      const name = user.user_metadata?.full_name || user.email;
      profileName.textContent = name;
      profileEmail.textContent = user.email;

      // Handle Avatar
      const avatarUrl = user.user_metadata?.avatar_url;
      if (avatarUrl) {
        defaultAvatar.style.display = 'none';
        userAvatar.src = avatarUrl;
        userAvatar.style.display = 'block';
        
        profileDefaultAvatar.style.display = 'none';
        profileAvatarLarge.src = avatarUrl;
        profileAvatarLarge.style.display = 'block';
      }
      
      // Attempt background push sync when dashboard opens
      syncAttendancesToSupabase();
      
      // Pull recent 20 records from cloud to populate local db
      pullAttendancesFromSupabase(user.id);
      
      // Load and render Recent Activity from local DB
      renderRecentActivity(user.id);
    }, 300);
  }

  // Background Async Pull Sync Function
  async function pullAttendancesFromSupabase(userId) {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        let insertedCount = 0;
        for (const record of data) {
          const didInsert = await insertPulledAttendance(record);
          if (didInsert) insertedCount++;
        }
        
        // Refresh the UI dynamically if new data was merged
        if (insertedCount > 0) {
          showToast(`Synced ${insertedCount} new records from Cloud`, 'success');
          renderRecentActivity(userId);
        }
      }
    } catch (err) {
      console.warn("Pull sync error:", err);
    }
  }

  // Background Async Sync Function
  async function syncAttendancesToSupabase() {
    try {
      const unsynced = await getUnsyncedAttendances();
      if (!unsynced || unsynced.length === 0) return;
      
      for (const record of unsynced) {
        // Attempt pushing to Supabase
        const { error } = await supabase.from('attendances').insert({
          user_id: record.user_id,
          timestamp: record.timestamp,
          type: record.type
        });
        
        if (!error) {
          // Mark SQLite record as synced
          await markAsSynced(record.id);
          console.log(`Synced record ${record.id} to Supabase`);
        } else {
          console.warn('Failed to sync record to Supabase:', error);
          showToast(`Sync Error: ${error.message}`, 'error');
        }
      }
    } catch (err) {
      console.warn("Background sync error:", err);
      showToast(`Sync Error: ${err.message}`, 'error');
    }
  }

  async function renderRecentActivity(userId) {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Loading activity...</p>';
    
    try {
      const { data: records, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      activityList.innerHTML = ''; // clear loading
      
      if (!records || records.length === 0) {
        activityList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">No recent activity</p>';
        return;
      }
      
      const recent = records;
      
      recent.forEach(rec => {
        const dateObj = new Date(rec.timestamp);
        
        // Format time dynamically in user's timezone
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        // Format relative date
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        let dateStr = '';
        if (dateObj.toDateString() === today.toDateString()) {
          dateStr = 'Today';
        } else if (dateObj.toDateString() === yesterday.toDateString()) {
          dateStr = 'Yesterday';
        } else {
          dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
        
        const isCheckIn = rec.type.includes('Check In');
        const iconClass = isCheckIn ? 'present' : (rec.type.includes('Leave') || rec.type.includes('Holiday') ? 'leave' : 'absent');
        
        let iconSvg = '';
        if (isCheckIn) {
          iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (rec.type.includes('Leave') || rec.type.includes('Holiday')) {
          iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';
        } else {
          iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
        }
        
        const title = rec.type;
          
        const isAdmin = currentSessionUser && currentSessionUser.email === 'admin.coderdy@gmail.com';
        const syncStatus = isAdmin ? '<span style="font-size: 10px; color: #10b981; margin-left: 5px;">(Cloud)</span>' : '';

        const itemHtml = `
          <div class="recent-item">
            <div class="recent-icon ${iconClass}">
              ${iconSvg}
            </div>
            <div class="recent-details">
              <h5>${title}</h5>
              <p>${timeStr} ${syncStatus}</p>
            </div>
            <div class="recent-time">${dateStr}</div>
          </div>
        `;
        
        activityList.insertAdjacentHTML('beforeend', itemHtml);
      });
      
    } catch (err) {
      console.warn("Error rendering activity:", err);
      activityList.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:14px; padding:20px;">Failed to load activity</p>';
    }
  }
});
