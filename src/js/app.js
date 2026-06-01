import { AuthService, AttendanceService, UserService, NotificationService, ProfileService, DebtService, StaffService } from './api.js';
import { initDB, addAttendance, getUnsyncedAttendances, markAsSynced, getLastAttendance, getAttendances, insertPulledAttendance, clearDB, addDebt, getDebts, getUnsyncedDebts, markDebtAsSynced, insertPulledDebt, markDebtAsPaidLocal, addStaff, getStaffs, updateStaffDepositLocal, updateStaffWaLocal, updateStaffNameLocal, getUnsyncedStaffs, markStaffAsSynced, insertPulledStaff } from './db.js';

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
  const companyPanel = document.getElementById('company-panel');
  const detailCompanyBtn = document.getElementById('detail-company-btn');
  const backFromCompanyBtn = document.getElementById('back-from-company');

  const attendancePanel = document.getElementById('attendance-panel');
  const attendanceBtn = document.getElementById('attendance-btn');
  const backFromAttendanceBtn = document.getElementById('back-from-attendance');
  
  const debtPanel = document.getElementById('debt-panel');
  const debtBtn = document.getElementById('debt-btn');
  const backFromDebtBtn = document.getElementById('back-from-debt');
  const addDebtBtn = document.getElementById('add-debt-btn');
  const debtName = document.getElementById('debt-name');
  const debtAmount = document.getElementById('debt-amount');
  const debtDesc = document.getElementById('debt-desc');
  const debtList = document.getElementById('debt-list');
  const tabDebtUnpaid = document.getElementById('tab-debt-unpaid');
  const tabDebtPaid = document.getElementById('tab-debt-paid');
  const debtTotalAmount = document.getElementById('debt-total-amount');
  const debtOptionsBtn = document.getElementById('debt-options-btn');
  const debtOptionsModal = document.getElementById('debt-options-modal');
  const closeOptionsModalBtn = document.getElementById('close-options-modal-btn');
  
  const optAddDebt = document.getElementById('opt-add-debt');
  const optAddDeposit = document.getElementById('opt-add-deposit');
  const optAddStaff = document.getElementById('opt-add-staff');
  const optListStaff = document.getElementById('opt-list-staff');
  
  const addDebtModal = document.getElementById('add-debt-modal');
  const closeDebtModalBtn = document.getElementById('close-debt-modal-btn');
  
  const addDepositModal = document.getElementById('add-deposit-modal');
  const closeDepositModalBtn = document.getElementById('close-deposit-modal-btn');
  
  const addStaffModal = document.getElementById('add-staff-modal');
  const closeStaffModalBtn = document.getElementById('close-staff-modal-btn');
  
  const listStaffModal = document.getElementById('list-staff-modal');
  const closeListStaffBtn = document.getElementById('close-list-staff-btn');
  const staffListContainer = document.getElementById('staff-list-container');
  
  const staffName = document.getElementById('staff-name');
  const staffWa = document.getElementById('staff-wa');
  const saveStaffBtn = document.getElementById('save-staff-btn');
  
  const depositName = document.getElementById('deposit-name');
  const depositAmount = document.getElementById('deposit-amount');
  const saveDepositBtn = document.getElementById('save-deposit-btn');
  const debtDetailPanel = document.getElementById('debt-detail-panel');
  const backFromDebtDetail = document.getElementById('back-from-debt-detail');
  const debtDetailTitle = document.getElementById('debt-detail-title');
  const debtDetailTbody = document.getElementById('debt-detail-tbody');
  
  const waShareBtn = document.getElementById('wa-share-btn');
  const detailTotalHutang = document.getElementById('detail-total-hutang');
  const detailTotalDeposit = document.getElementById('detail-total-deposit');
  const detailSisaLabel = document.getElementById('detail-sisa-label');
  const detailSisaAmount = document.getElementById('detail-sisa-amount');
  const payAllDebtBtn = document.getElementById('pay-all-debt-btn');
  
  const payConfirmModal = document.getElementById('pay-confirm-modal');
  const payConfirmMsg = document.getElementById('pay-confirm-msg');
  const payCancelBtn = document.getElementById('pay-cancel-btn');
  const payConfirmBtn = document.getElementById('pay-confirm-btn');
  
  const payInputModal = document.getElementById('pay-input-modal');
  const payInputAmount = document.getElementById('pay-input-amount');
  const payModalHutang = document.getElementById('pay-modal-hutang');
  const payModalDeposit = document.getElementById('pay-modal-deposit');
  const payModalKekurangan = document.getElementById('pay-modal-kekurangan');
  const submitPayBtn = document.getElementById('submit-pay-btn');
  const closePayModalBtn = document.getElementById('close-pay-modal-btn');
  
  const editWaModal = document.getElementById('edit-wa-modal');
  const editWaInput = document.getElementById('edit-wa-input');
  const closeEditWaBtn = document.getElementById('close-edit-wa-btn');
  const saveEditWaBtn = document.getElementById('save-edit-wa-btn');
  
  const editNameModal = document.getElementById('edit-name-modal');
  const editNameInput = document.getElementById('edit-name-input');
  const closeEditNameBtn = document.getElementById('close-edit-name-btn');
  const saveEditNameBtn = document.getElementById('save-edit-name-btn');
  
  let currentDebtTab = 'unpaid';
  let currentEditingStaffId = null;
  
  function formatRupiahInput(e) {
    // Bug #12 fix: strip ALL non-digit chars (including commas), then insert dots as thousands sep
    let value = e.target.value.replace(/[^\d]/g, '');
    e.target.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function parseRupiahStr(str) {
    // Dots are thousands separators — strip them, then parse
    return parseInt(str.replace(/\./g, '').replace(/[^\d]/g, '')) || 0;
  }
  
  debtAmount?.addEventListener('input', formatRupiahInput);
  depositAmount?.addEventListener('input', formatRupiahInput);
  payInputAmount?.addEventListener('input', formatRupiahInput);
  
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
  }
  const logoutBtn = document.getElementById('logout-btn');
  const notificationBtn = document.getElementById('notification-btn');
  const backToDashBtn = document.getElementById('back-to-dash');
  const devClearDbBtn = document.getElementById('dev-clear-db-btn');
  const devGenerateDummyBtn = document.getElementById('dev-generate-dummy-btn');
  const notificationPanel = document.getElementById('notification-panel');
  const backFromNotificationBtn = document.getElementById('back-from-notification');
  const tabUnread = document.getElementById('tab-unread');
  const tabRead = document.getElementById('tab-read');
  const notifList = document.getElementById('notif-list');
  const unreadCountBadge = document.getElementById('unread-count');
  let currentNotifTab = 'unread';

  
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
  }).catch(err => {
    console.error("Init DB failed", err);
    showToast('Failed to initialize local database.', 'error');
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
      const { data: { session }, error } = await AuthService.getSession();
      
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
  AuthService.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      if (currentSessionUser && currentSessionUser.id === session.user.id) return; // Prevent multiple triggers
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
      const { data, error } = await AuthService.signInWithOAuth();

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
      const { data, error } = await AuthService.signInWithPasskey();
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
      const { data, error } = await AuthService.registerPasskey();
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
      const { error } = await AttendanceService.deleteUserAttendances(currentSessionUser.id);
        
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
          created_at: randomDate.toISOString(),
          status: type
        });
      }
      
      const { error } = await AttendanceService.insertAttendances(records);
      
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

  modalConfirmBtn?.addEventListener('click', async () => {
    modalConfirmBtn.innerHTML = '<div class="spinner" style="border-color: white; border-top-color: transparent;"></div>';
    await AuthService.signOut();
    
    // Clear notifications and realtime channel
    if (window.notifSubscription) {
      NotificationService.unsubscribeToNotifications(window.notifSubscription);
      window.notifSubscription = null;
    }
    window.currentNotifications = [];
    currentSessionUser = null;
    
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
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate > endDate) {
      showToast('Start date must be before end date', 'error');
      return;
    }
    
    const today = new Date();
    if (startDate > today || endDate > today) {
      showToast('Date cannot be in the future', 'error');
      return;
    }
    
    if (!currentSessionUser) return;
    
    generateReportBtn.innerHTML = '<div class="spinner" style="border-color: rgba(255,255,255,0.2); border-top-color: white; width: 18px; height: 18px; position: relative; right: auto; margin-right: 8px;"></div> Generating...';
    generateReportBtn.disabled = true;
    reportResultsList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Loading report data...</p>';
    
    try {
      // Append time to ensure full day coverage (local time)
      const startDateTime = new Date(start + 'T00:00:00').toISOString();
      const endDateTime = new Date(end + 'T23:59:59.999').toISOString();
      
      const { data, error } = await AttendanceService.getAttendancesByDateRange(currentSessionUser.id, startDateTime, endDateTime);
        
      if (error) throw error;
      
      reportResultsList.innerHTML = '';
      
      if (!data || data.length === 0) {
        reportResultsList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">No records found for selected dates.</p>';
      } else {
        const grouped = {};
        
        data.forEach(rec => {
          const dateObj = new Date(rec.created_at);
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
          
          if (rec.status.includes('Check In')) {
            grouped[dateKey].checkIn = timeStr;
          } else if (rec.status.includes('Check Out')) {
            grouped[dateKey].checkOut = timeStr;
          } else {
            // Sick Leave, Leave, Holiday
            grouped[dateKey].leaveType = rec.status;
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

  
  function renderNotifications() {
    if (!notifList) return;
    const notifications = window.currentNotifications || [];
    const filtered = notifications.filter(n => currentNotifTab === 'unread' ? !n.is_read : n.is_read);
    
    // update count
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCountBadge) {
      unreadCountBadge.textContent = unreadCount;
      unreadCountBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    
    if (filtered.length === 0) {
      notifList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">No ' + currentNotifTab + ' notifications</p>';
      return;
    }
    
    notifList.innerHTML = filtered.map(n => `
      <div style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-left: 4px solid ${n.is_read ? '#cbd5e1' : '#4f46e5'};">
        <h4 style="margin: 0 0 5px 0; font-size: 15px; color: #1e293b;">${n.title}</h4>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; line-height: 1.4;">${n.message}</p>
        <span style="font-size: 11px; color: #94a3b8;">${new Date(n.created_at).toLocaleString()}</span>
      </div>
    `).join('');
  }

  notificationBtn?.addEventListener('click', () => {
    // Hide dashboard
    dashboardPanel.style.opacity = '0';
    setTimeout(() => {
      dashboardPanel.classList.add('hidden');
      notificationPanel.classList.remove('hidden');
      setTimeout(() => { notificationPanel.style.opacity = '1'; }, 50);
      renderNotifications();
    }, 300);
  });

  backFromNotificationBtn?.addEventListener('click', async () => {
    // If there were unread notifications, mark them read now that user viewed them
    const notifications = window.currentNotifications || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > 0 && currentNotifTab === 'unread') {
      await NotificationService.markAllAsRead(currentSessionUser.id);
      notifications.forEach(n => n.is_read = true);
      const badge = document.querySelector('#notification-btn span');
      if (badge) badge.style.display = 'none';
    }

    notificationPanel.style.opacity = '0';
    setTimeout(() => {
      notificationPanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  tabUnread?.addEventListener('click', () => {
    currentNotifTab = 'unread';
    tabUnread.style.background = 'white';
    tabUnread.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    tabUnread.style.color = '#1e293b';
    
    tabRead.style.background = 'transparent';
    tabRead.style.boxShadow = 'none';
    tabRead.style.color = '#64748b';
    renderNotifications();
  });

  tabRead?.addEventListener('click', async () => {
    currentNotifTab = 'read';
    tabRead.style.background = 'white';
    tabRead.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    tabRead.style.color = '#1e293b';
    
    tabUnread.style.background = 'transparent';
    tabUnread.style.boxShadow = 'none';
    tabUnread.style.color = '#64748b';
    
    // Auto mark as read when switching to read tab
    const notifications = window.currentNotifications || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > 0) {
      await NotificationService.markAllAsRead(currentSessionUser.id);
      notifications.forEach(n => n.is_read = true);
      const badge = document.querySelector('#notification-btn span');
      if (badge) badge.style.display = 'none';
    }
    
    renderNotifications();
  });


  detailCompanyBtn?.addEventListener('click', async () => {
    profilePanel.style.opacity = '0';
    
    // Fetch profile details for company info
    const { data: prof, error } = await ProfileService.getProfile(currentSessionUser.id);
    if (prof && !error) {
      document.getElementById('company-detail-name').textContent = prof.company || '-';
      document.getElementById('company-detail-dept').textContent = prof.department || '-';
      document.getElementById('company-detail-title').textContent = prof.job_title || '-';
    }
    
    setTimeout(() => {
      profilePanel.classList.add('hidden');
      companyPanel.classList.remove('hidden');
      setTimeout(() => { companyPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  backFromCompanyBtn?.addEventListener('click', () => {
    companyPanel.style.opacity = '0';
    setTimeout(() => {
      companyPanel.classList.add('hidden');
      profilePanel.classList.remove('hidden');
      setTimeout(() => { profilePanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  backToDashBtn?.addEventListener('click', () => {
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
        punchBtn.style.opacity = '1';
        punchBtn.style.transform = 'scale(1)';
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
        punchBtn.style.opacity = '1';
        punchBtn.style.transform = 'scale(1)';
        punchBtn.style.background = 'linear-gradient(135deg, #4f46e5, #3b82f6)';
        punchBtn.style.boxShadow = '0 15px 35px rgba(79, 70, 229, 0.4)';
        punchBtn.style.cursor = 'pointer';
        punchBtn.style.pointerEvents = 'auto'; // Bug #13 fix: reset pointerEvents
        
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
      if (clockInterval) clearInterval(clockInterval);
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
          punchBtn.disabled = false;
          punchBtn.style.opacity = '1';
          showToast('Failed to record attendance.', 'error');
        }
      })
      .catch(err => {
        punchBtn.disabled = false;
        punchBtn.style.opacity = '1';
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
      // Just restore scale visually, keep disabled until execution completes
      punchBtn.style.transform = 'scale(1)';
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
    punchBtn.disabled = false;
    punchBtn.style.opacity = '1';
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
  
  // ================= DEBT LOGIC =================
  debtBtn?.addEventListener('click', () => {
    dashboardPanel.style.opacity = '0';
    mainBottomNav?.classList.add('hidden');
    setTimeout(() => {
      dashboardPanel.classList.add('hidden');
      debtPanel.classList.remove('hidden');
      if (currentSessionUser) renderDebts(currentSessionUser.id);
      setTimeout(() => { debtPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  backFromDebtBtn?.addEventListener('click', () => {
    debtPanel.style.opacity = '0';
    setTimeout(() => {
      debtPanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      mainBottomNav?.classList.remove('hidden');
      setTimeout(() => { dashboardPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  tabDebtUnpaid?.addEventListener('click', () => {
    currentDebtTab = 'unpaid';
    tabDebtUnpaid.style.background = 'white';
    tabDebtUnpaid.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    tabDebtUnpaid.style.color = '#1e293b';
    tabDebtPaid.style.background = 'transparent';
    tabDebtPaid.style.boxShadow = 'none';
    tabDebtPaid.style.color = '#64748b';
    if (currentSessionUser) renderDebts(currentSessionUser.id);
  });

  tabDebtPaid?.addEventListener('click', () => {
    currentDebtTab = 'paid';
    tabDebtPaid.style.background = 'white';
    tabDebtPaid.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    tabDebtPaid.style.color = '#1e293b';
    tabDebtUnpaid.style.background = 'transparent';
    tabDebtUnpaid.style.boxShadow = 'none';
    tabDebtUnpaid.style.color = '#64748b';
    if (currentSessionUser) renderDebts(currentSessionUser.id);
  });
  
  debtOptionsBtn?.addEventListener('click', () => {
    debtOptionsModal?.classList.remove('hidden');
  });
  
  closeOptionsModalBtn?.addEventListener('click', () => {
    debtOptionsModal?.classList.add('hidden');
  });

  optAddDebt?.addEventListener('click', async () => {
    debtOptionsModal?.classList.add('hidden');
    await populateStaffSelects();
    addDebtModal?.classList.remove('hidden');
  });
  
  optAddDeposit?.addEventListener('click', async () => {
    debtOptionsModal?.classList.add('hidden');
    await populateStaffSelects();
    addDepositModal?.classList.remove('hidden');
  });
  
  optAddStaff?.addEventListener('click', () => {
    debtOptionsModal?.classList.add('hidden');
    addStaffModal?.classList.remove('hidden');
  });
  
  optListStaff?.addEventListener('click', async () => {
    debtOptionsModal?.classList.add('hidden');
    listStaffModal?.classList.remove('hidden');
    if (currentSessionUser) {
      await renderStaffs(currentSessionUser.id);
    }
  });

  closeDebtModalBtn?.addEventListener('click', () => addDebtModal?.classList.add('hidden'));
  closeDepositModalBtn?.addEventListener('click', () => addDepositModal?.classList.add('hidden'));
  closeStaffModalBtn?.addEventListener('click', () => addStaffModal?.classList.add('hidden'));
  closeListStaffBtn?.addEventListener('click', () => listStaffModal?.classList.add('hidden'));

  payCancelBtn?.addEventListener('click', () => payConfirmModal?.classList.add('hidden'));
  closePayModalBtn?.addEventListener('click', () => payInputModal?.classList.add('hidden'));
  closeEditWaBtn?.addEventListener('click', () => {
    editWaModal?.classList.add('hidden');
    listStaffModal?.classList.remove('hidden');
  });
  closeEditNameBtn?.addEventListener('click', () => {
    editNameModal?.classList.add('hidden');
    listStaffModal?.classList.remove('hidden');
  });

  saveEditWaBtn?.addEventListener('click', async () => {
    if (!currentEditingStaffId) return;
    const newWa = editWaInput?.value.trim();
    if (!newWa) {
      showToast('Masukkan nomor WA yang valid', 'error');
      return;
    }
    await updateStaffWaLocal(currentEditingStaffId, newWa);
    editWaModal?.classList.add('hidden');
    listStaffModal?.classList.remove('hidden');
    showToast('Nomor WA berhasil diubah', 'success');
    if (currentSessionUser) {
      renderStaffs(currentSessionUser.id);
      syncStaffsToSupabase();
    }
  });

  saveEditNameBtn?.addEventListener('click', async () => {
    if (!currentEditingStaffId) return;
    const newName = editNameInput?.value.trim();
    if (!newName) {
      showToast('Masukkan nama yang valid', 'error');
      return;
    }
    await updateStaffNameLocal(currentEditingStaffId, newName);
    editNameModal?.classList.add('hidden');
    listStaffModal?.classList.remove('hidden');
    showToast('Nama berhasil diubah', 'success');
    if (currentSessionUser) {
      renderStaffs(currentSessionUser.id);
      syncStaffsToSupabase();
    }
  });

  backFromDebtDetail?.addEventListener('click', () => {
    debtDetailPanel?.classList.add('hidden');
    debtPanel?.classList.remove('hidden');
    // Refresh to reflect any changes made in the detail view
    if (currentSessionUser) renderDebts(currentSessionUser.id);
  });

  addDebtBtn?.addEventListener('click', async () => {
    if (!currentSessionUser) return;
    const name = debtName.value.trim();
    const amount = parseRupiahStr(debtAmount.value);
    const desc = debtDesc.value.trim() || '-';
    
    if (!name || isNaN(amount) || amount <= 0) {
      showToast('Masukkan nama dan jumlah yang valid', 'error');
      return;
    }
    
    addDebtBtn.disabled = true;
    addDebtBtn.innerHTML = '<div class="spinner" style="border-color: rgba(255,255,255,0.2); border-top-color: white; width: 18px; height: 18px; position: relative; right: auto;"></div>';
    
    try {
      const id = generateUUID();
      const createdAt = new Date().toISOString();
      // Bug #5 fix: store staff_id as well so name changes don't break linkage
      // We still store coworker_name for display, but the selected value is now the staff ID
      const selectedStaffId = debtName.value.trim();
      const allStaffsForDebt = await getStaffs(currentSessionUser.id);
      const selectedStaff = allStaffsForDebt.find(s => s.id === selectedStaffId);
      const coworkerNameToStore = selectedStaff ? selectedStaff.name : name;
      await addDebt(id, currentSessionUser.id, coworkerNameToStore, amount, desc, createdAt, 0, 0);
      
      debtName.value = '';
      debtAmount.value = '';
      debtDesc.value = '';
      
      showToast('Piutang berhasil dicatat', 'success');
      renderDebts(currentSessionUser.id);
      syncDebtsToSupabase();
      addDebtModal?.classList.add('hidden');
    } catch (err) {
      showToast('Gagal mencatat piutang', 'error');
    } finally {
      addDebtBtn.disabled = false;
      addDebtBtn.innerHTML = 'Simpan Piutang';
    }
  });

  saveStaffBtn?.addEventListener('click', async () => {
    if (!currentSessionUser) return;
    const name = staffName.value.trim();
    const wa = staffWa.value.trim();
    
    if (!name) {
      showToast('Masukkan nama staff', 'error');
      return;
    }
    
    saveStaffBtn.disabled = true;
    saveStaffBtn.innerHTML = '<div class="spinner" style="border-color: rgba(255,255,255,0.2); border-top-color: white; width: 18px; height: 18px; position: relative; right: auto;"></div>';
    
    try {
      const id = generateUUID();
      const createdAt = new Date().toISOString();
      await addStaff(id, currentSessionUser.id, name, wa, 0, createdAt, 0);
      
      staffName.value = '';
      staffWa.value = '';
      
      showToast('Data staff berhasil disimpan', 'success');
      syncStaffsToSupabase();
      addStaffModal?.classList.add('hidden');
    } catch (err) {
      showToast('Gagal menyimpan staff', 'error');
    } finally {
      saveStaffBtn.disabled = false;
      saveStaffBtn.innerHTML = 'Simpan Data Staff';
    }
  });

  saveDepositBtn?.addEventListener('click', async () => {
    if (!currentSessionUser) return;
    const name = depositName.value.trim();
    const amount = parseRupiahStr(depositAmount.value);
    
    if (!name || isNaN(amount) || amount <= 0) {
      showToast('Masukkan nama dan jumlah deposit yang valid', 'error');
      return;
    }
    
    saveDepositBtn.disabled = true;
    saveDepositBtn.innerHTML = '<div class="spinner" style="border-color: rgba(255,255,255,0.2); border-top-color: white; width: 18px; height: 18px; position: relative; right: auto;"></div>';
    
    try {
      const staffs = await getStaffs(currentSessionUser.id);
      // Bug #4 fix: lookup by ID (select value is staff ID), not by name
      const selectedId = depositName.value.trim();
      const staff = staffs.find(s => s.id === selectedId);
      
      if (!staff) {
        showToast('Staff tidak ditemukan. Daftar dulu ya.', 'error');
        saveDepositBtn.disabled = false;
        saveDepositBtn.innerHTML = 'Simpan Deposit';
        return;
      }
      
      await updateStaffDepositLocal(staff.id, amount);
      
      depositName.value = '';
      depositAmount.value = '';
      
      showToast('Deposit berhasil ditambahkan', 'success');
      syncStaffsToSupabase();
      addDepositModal?.classList.add('hidden');
    } catch (err) {
      showToast('Gagal menambah deposit', 'error');
    } finally {
      saveDepositBtn.disabled = false;
      saveDepositBtn.innerHTML = 'Simpan Deposit';
    }
  });


  window.markAsPaid = async function(id) {
    if (!currentSessionUser) return;
    if (!confirm('Tandai piutang ini sudah dibayar lunas?')) return;
    
    await markDebtAsPaidLocal(id);
    showToast('Piutang ditandai lunas', 'success');
    renderDebts(currentSessionUser.id);
    syncDebtsToSupabase();
  };

  async function renderDebts(userId) {
    if (!debtList) return;
    debtList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Memuat data piutang...</p>';
    
    try {
      const allDebts = await getDebts(userId);
      const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
      
      // Calculate Total Unpaid
      if (debtTotalAmount) {
        const totalUnpaid = allDebts.filter(d => d.is_paid === 0).reduce((sum, d) => sum + d.amount, 0);
        debtTotalAmount.textContent = formatter.format(totalUnpaid);
      }
      
      if (currentDebtTab === 'unpaid') {
        // "List Piutang Staff": Group by coworker_name for unpaid debts
        const unpaidDebts = allDebts.filter(d => d.is_paid === 0);
        if (unpaidDebts.length === 0) {
          debtList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Semua hutang rekan kerja sudah lunas 🎉</p>';
          return;
        }
        
        const grouped = unpaidDebts.reduce((acc, d) => {
          if (!acc[d.coworker_name]) acc[d.coworker_name] = 0;
          acc[d.coworker_name] += d.amount;
          return acc;
        }, {});
        
        debtList.innerHTML = Object.entries(grouped).map(([name, amount]) => {
          return `
            <div onclick="window.showStaffDebtDetail('${name.replace(/'/g, "\\'")}')" style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-left: 4px solid #f59e0b; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;">
              <div>
                <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #1e293b; font-weight: 700;">${name}</h4>
                <span style="font-size: 13px; color: #64748b;">Belum Lunas</span>
              </div>
              <span style="font-size: 16px; font-weight: 800; color: #ef4444;">${formatter.format(amount)}</span>
            </div>
          `;
        }).join('');
        
      } else {
        // "Recent Activity": Show only PAID debts in reverse-chronological order (Bug #6 fix)
        const paidDebts = allDebts.filter(d => d.is_paid === 1);
        if (paidDebts.length === 0) {
          debtList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Belum ada aktivitas piutang yang lunas.</p>';
          return;
        }
        
        debtList.innerHTML = paidDebts.map(d => {
          const dateStr = new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const amountStr = formatter.format(d.amount);
          const isPaid = d.is_paid === 1;
          
          return `
            <div style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-left: 4px solid ${isPaid ? '#10b981' : '#f59e0b'}; opacity: ${isPaid ? '0.8' : '1'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                <h4 style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 700;">${d.coworker_name}</h4>
                <span style="font-size: 15px; font-weight: 800; color: ${isPaid ? '#10b981' : '#ef4444'};">${amountStr}</span>
              </div>
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">${d.description}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: #94a3b8;">${dateStr}</span>
                ${!isPaid ? `<span style="font-size: 12px; color: #ef4444; font-weight: 700;">⏳ Belum Lunas</span>` : `<span style="font-size: 12px; color: #10b981; font-weight: 700;">✅ Lunas</span>`}
              </div>
            </div>
          `;
        }).join('');
      }
    } catch(e) {
      debtList.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:14px; padding:20px;">Gagal memuat piutang</p>';
    }
  }

  window.showStaffDebtDetail = async function(staffName) {
    if (!currentSessionUser) return;
    
    // Switch panels
    debtPanel?.classList.add('hidden');
    debtDetailPanel?.classList.remove('hidden');
    if (debtDetailTitle) debtDetailTitle.innerText = 'Rincian Hutang ' + staffName;
    
    if (debtDetailTbody) debtDetailTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Memuat rincian...</td></tr>';
    
    try {
      const allDebts = await getDebts(currentSessionUser.id);
      const allStaffs = await getStaffs(currentSessionUser.id);
      const staff = allStaffs.find(s => s.name.toLowerCase() === staffName.toLowerCase());
      
      const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
      const unpaidDebts = allDebts.filter(d => d.is_paid === 0 && d.coworker_name.toLowerCase() === staffName.toLowerCase());
      
      const totalHutang = unpaidDebts.reduce((sum, d) => sum + d.amount, 0);
      const totalDeposit = staff ? staff.total_deposit : 0;
      
      if (detailTotalHutang) detailTotalHutang.innerText = formatter.format(totalHutang);
      if (detailTotalDeposit) detailTotalDeposit.innerText = formatter.format(totalDeposit);
      
      const diff = totalHutang - totalDeposit;
      if (detailSisaLabel && detailSisaAmount) {
        if (diff > 0) {
          detailSisaLabel.innerText = 'Sisa Hutang:';
          detailSisaAmount.innerText = formatter.format(diff);
          detailSisaAmount.style.color = '#ef4444';
        } else {
          detailSisaLabel.innerText = 'Sisa Deposit:';
          detailSisaAmount.innerText = formatter.format(Math.abs(diff));
          detailSisaAmount.style.color = '#10b981';
        }
      }
      
      // Setup WhatsApp button
      // Bug #7 fix: use plain number formatter without Intl to avoid non-breaking space \u00a0
      const formatRp = (n) => 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      if (waShareBtn && staff && staff.whatsapp) {
        waShareBtn.style.display = 'flex';
        let msg = `${staff.name},\nBerikut adalah rincian tagihan:\n\n`;
        unpaidDebts.forEach(d => {
           const dStr = new Date(d.created_at).toLocaleDateString('id-ID');
           msg += `* ${dStr} | ${d.description}: ${formatRp(d.amount)}\n`;
        });
        msg += `\n*Total Tagihan: ${formatRp(totalHutang)}.*`;
        if (totalDeposit > 0) {
           msg += `\n*Total Deposit: ${formatRp(totalDeposit)}.*`;
           if (diff > 0) msg += `\n*Sisa Tagihan: ${formatRp(diff)}.*`;
           else msg += `\n*Tagihan tertutup deposit, Sisa Deposit: ${formatRp(Math.abs(diff))}.*`;
        }
        
        let waNumber = staff.whatsapp.replace(/\D/g, '');
        if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);
        waShareBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      } else if (waShareBtn) {
        waShareBtn.style.display = 'none'; // hide if no WA number
      }
      
      if (payAllDebtBtn) {
        if (unpaidDebts.length === 0) {
          payAllDebtBtn.style.display = 'none';
        } else {
          payAllDebtBtn.style.display = 'block';
          
          if (totalDeposit >= totalHutang) {
            payAllDebtBtn.innerText = 'Lunasi (Potong Deposit)';
            payAllDebtBtn.onclick = () => {
              if (payConfirmMsg) payConfirmMsg.innerText = `Deposit staff ini mencukupi untuk melunasi seluruh piutangnya. Lanjutkan pemotongan deposit otomatis sebesar ${formatter.format(totalHutang)}?`;
              payConfirmModal?.classList.remove('hidden');
              
              if (payConfirmBtn) {
                payConfirmBtn.onclick = async () => {
                  payConfirmModal?.classList.add('hidden');
                  payAllDebtBtn.disabled = true;
                  payAllDebtBtn.innerText = 'Memproses...';
                  
                  for (const d of unpaidDebts) {
                    await markDebtAsPaidLocal(d.id);
                  }
                  if (staff) await updateStaffDepositLocal(staff.id, -totalHutang);
                  
                  showToast('Hutang berhasil dilunasi dari deposit', 'success');
                  // Bug #8 fix: await before re-rendering to prevent double-pay
                  await syncDebtsToSupabase();
                  await syncStaffsToSupabase();
                  payAllDebtBtn.disabled = false;
                  await window.showStaffDebtDetail(staffName);
                };
              }
            };
          } else {
            payAllDebtBtn.innerText = 'Bayar Piutang';
            payAllDebtBtn.onclick = () => {
              const kurang = totalHutang - totalDeposit;
              if (payModalHutang) payModalHutang.innerText = formatter.format(totalHutang);
              if (payModalDeposit) payModalDeposit.innerText = formatter.format(totalDeposit);
              if (payModalKekurangan) payModalKekurangan.innerText = formatter.format(kurang);
              if (payInputAmount) payInputAmount.value = '';
              payInputModal?.classList.remove('hidden');
              
              if (submitPayBtn) {
                submitPayBtn.onclick = async () => {
                  const uangDiterima = parseRupiahStr(payInputAmount?.value || '0');
                  if (uangDiterima <= 0) {
                    showToast('Masukkan nominal yang valid', 'error');
                    return;
                  }
                  
                  payInputModal?.classList.add('hidden');
                  payAllDebtBtn.disabled = true;
                  payAllDebtBtn.innerText = 'Memproses...';
                  
                  // Bug #1 fix: track totalAvailable (deposit + cash), then delta vs original deposit
                  let totalAvailable = totalDeposit + uangDiterima;
                  
                  // Sort oldest debts first
                  const sortedDebts = [...unpaidDebts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                  
                  for (const d of sortedDebts) {
                    if (totalAvailable >= d.amount) {
                      await markDebtAsPaidLocal(d.id);
                      totalAvailable -= d.amount;
                    }
                  }
                  
                  // The remaining totalAvailable is the new deposit balance
                  // depositDelta = newDeposit - oldDeposit (can be positive or negative)
                  const depositDelta = totalAvailable - totalDeposit;
                  if (staff) {
                    await updateStaffDepositLocal(staff.id, depositDelta);
                  }
                  
                  showToast('Pembayaran berhasil dicatat', 'success');
                  // Bug #8 fix: await sync before re-rendering
                  await syncDebtsToSupabase();
                  await syncStaffsToSupabase();
                  payAllDebtBtn.disabled = false;
                  await window.showStaffDebtDetail(staffName);
                };
              }
            };
          }
        }
      }
      
      if (unpaidDebts.length === 0) {
        if (debtDetailTbody) debtDetailTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Sudah lunas semua</td></tr>';
        return;
      }
      
      const html = unpaidDebts.map(d => {
        const dateStr = new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const amountStr = formatter.format(d.amount);
        return `
          <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s; background: white;">
            <td style="padding: 15px; font-size: 13px; color: #64748b;">${dateStr}</td>
            <td style="padding: 15px; font-size: 14px; font-weight: 600; color: #1e293b;">${d.description}</td>
            <td style="padding: 15px; font-size: 14px; font-weight: 700; color: #ef4444; text-align: right;">${amountStr}</td>
          </tr>
        `;
      }).join('');
      
      if (debtDetailTbody) debtDetailTbody.innerHTML = html;
    } catch (e) {
      if (debtDetailTbody) debtDetailTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444; font-size:14px; padding:20px;">Gagal memuat rincian</td></tr>';
    }
  };

  window.markAsPaidAndRefreshDetail = async function(id, staffName) {
    if (!currentSessionUser) return;
    if (!confirm('Tandai piutang ini sudah dibayar lunas?')) return;
    
    await markDebtAsPaidLocal(id);
    showToast('Piutang ditandai lunas', 'success');
    syncDebtsToSupabase();
    window.showStaffDebtDetail(staffName); // Refresh table
  };

  async function syncDebtsToSupabase() {
    try {
      const unsynced = await getUnsyncedDebts();
      if (!unsynced || unsynced.length === 0) return;
      
      let failCount = 0;
      for (const record of unsynced) {
        const { error } = await DebtService.insertDebts([{
          id: record.id,
          user_id: record.user_id,
          coworker_name: record.coworker_name,
          amount: record.amount,
          description: record.description,
          is_paid: record.is_paid === 1,
          created_at: record.created_at
        }]);
        
        if (!error) {
          await markDebtAsSynced(record.id);
        } else {
          failCount++;
        }
      }
    } catch(err) {
      console.warn("Debt sync err", err);
    }
  }

  async function pullDebtsFromSupabase(userId) {
    try {
      const { data, error } = await DebtService.getDebts(userId);
      if (error) throw error;
      if (data && data.length > 0) {
        for (const record of data) {
          await insertPulledDebt(record);
        }
        if (debtPanel && !debtPanel.classList.contains('hidden')) {
           renderDebts(userId);
        }
      }
    } catch(err) {
      console.warn("Pull debts err", err);
    }
  }

  async function populateStaffSelects() {
    if (!currentSessionUser) return;
    try {
      const staffs = await getStaffs(currentSessionUser.id);
      // Bug #4/#5 fix: use staff ID as option value so name changes don't break deposit/debt lookup
      const optionsHtml = '<option value="" disabled selected>Pilih Nama Staff</option>' + 
        staffs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        
      if (debtName) debtName.innerHTML = optionsHtml;
      if (depositName) depositName.innerHTML = optionsHtml;
    } catch (err) {
      console.warn("Failed to populate staff selects", err);
    }
  }

  async function syncStaffsToSupabase() {
    try {
      const unsynced = await getUnsyncedStaffs();
      if (!unsynced || unsynced.length === 0) return;
      
      let failCount = 0;
      for (const record of unsynced) {
        const { error } = await StaffService.insertStaffs([{
          id: record.id,
          user_id: record.user_id,
          name: record.name,
          whatsapp: record.whatsapp,
          total_deposit: record.total_deposit,
          created_at: record.created_at
        }]);
        if (!error) {
          await markStaffAsSynced(record.id);
        } else {
          failCount++;
        }
      }
      if (failCount === 0) console.log('All staffs synced');
    } catch (err) {
      console.error('Error syncing staffs:', err);
    }
  }

  async function pullStaffsFromSupabase() {
    if (!currentSessionUser) return;
    try {
      // Bug #9 fix: await push first before pulling to prevent race condition
      await syncStaffsToSupabase();
      const { data, error } = await StaffService.getStaffs(currentSessionUser.id);
      if (error) throw error;
      if (data) {
        for (const record of data) {
          await insertPulledStaff(record);
        }
        if (listStaffModal && !listStaffModal.classList.contains('hidden')) {
          renderStaffs(currentSessionUser.id);
        }
      }
    } catch (err) {
      console.error('Error pulling staffs:', err);
    }
  }
  
  async function renderStaffs(userId) {
    if (!staffListContainer) return;
    staffListContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Memuat data staff...</p>';
    
    try {
      const staffs = await getStaffs(userId);
      const allDebts = await getDebts(userId);
      const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
      
      if (staffs.length === 0) {
        staffListContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">Belum ada data staff.</p>';
        return;
      }
      
      staffListContainer.innerHTML = staffs.map(staff => {
        // Calculate total unpaid debt for this staff (matching by name)
        const totalHutang = allDebts
          .filter(d => d.is_paid === 0 && d.coworker_name.toLowerCase() === staff.name.toLowerCase())
          .reduce((sum, d) => sum + d.amount, 0);
          
        return `
          <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
                  <h4 style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 700;">${staff.name}</h4>
                  <button onclick="window.openEditNameModal('${staff.id}', '${staff.name.replace(/'/g, "\\'")}')" style="background: none; border: none; cursor: pointer; color: #3b82f6; padding: 0; display: flex; align-items: center;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                </div>
                <span style="font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 5px;">
                  WA: ${staff.whatsapp || '-'}
                  <button onclick="window.openEditWaModal('${staff.id}', '${staff.whatsapp || ''}')" style="background: none; border: none; cursor: pointer; color: #3b82f6; padding: 0; display: flex; align-items: center;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                </span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px;">
              <div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Deposit</div>
                <div style="font-size: 14px; font-weight: 800; color: #10b981;">${formatter.format(staff.total_deposit)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Hutang</div>
                <div style="font-size: 14px; font-weight: 800; color: #ef4444;">${formatter.format(totalHutang)}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      staffListContainer.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:14px; padding:20px;">Gagal memuat staff</p>';
    }
  }

  window.openEditWaModal = function(id, wa) {
    currentEditingStaffId = id;
    if (editWaInput) editWaInput.value = wa;
    listStaffModal?.classList.add('hidden');
    editWaModal?.classList.remove('hidden');
  };

  window.openEditNameModal = function(id, name) {
    currentEditingStaffId = id;
    if (editNameInput) editNameInput.value = name;
    listStaffModal?.classList.add('hidden');
    editNameModal?.classList.remove('hidden');
  };

  // ============================================
  
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
      
      // Role Badge Check & Dev Buttons
      const roleBadge = document.getElementById('header-role-badge');
      
      // Default hide Dev buttons
      devClearDbBtn?.classList.add('hidden');
      devGenerateDummyBtn?.classList.add('hidden');
      
      // Fetch role from Supabase
      UserService.getUserRole(user.id)
        .then(({ data, error }) => {
          let userRole = 'Personal';
          if (!error && data) {
            userRole = data.role;
          }
          
          // Save role globally for other functions if needed
          window.currentUserRole = userRole;
          
          if (userRole === 'Developer' || userRole === 'Administrator') {
            devClearDbBtn?.classList.remove('hidden');
            devGenerateDummyBtn?.classList.remove('hidden');
          }
          
          if (userRole === 'Employee') {
            if (detailCompanyBtn) detailCompanyBtn.classList.remove('hidden');
          } else {
            if (detailCompanyBtn) detailCompanyBtn.classList.add('hidden');
          }

          
          if (roleBadge) {
            roleBadge.textContent = userRole.toUpperCase();
            roleBadge.classList.remove('hidden');
            
            // Assign colors based on role
            switch(userRole) {
              case 'Developer':
                roleBadge.style.backgroundColor = '#dbeafe'; roleBadge.style.color = '#1e3a8a'; break;
              case 'Administrator':
                roleBadge.style.backgroundColor = '#ede9fe'; roleBadge.style.color = '#5b21b6'; break;
              case 'Supervisor':
                roleBadge.style.backgroundColor = '#ffedd5'; roleBadge.style.color = '#9a3412'; break;
              case 'Employee':
                roleBadge.style.backgroundColor = '#ccfbf1'; roleBadge.style.color = '#115e59'; break;
              case 'Tester':
                roleBadge.style.backgroundColor = '#fce7f3'; roleBadge.style.color = '#9d174d'; break;
              default: // Personal
                roleBadge.style.backgroundColor = '#f1f5f9'; roleBadge.style.color = '#475569'; break;
            }
          }
        });
      
      // Check for existing passkeys
      if (AuthService.isPasskeySupported()) {
        AuthService.listPasskeys().then(({ data, error }) => {
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
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (avatarUrl) {

        profileDefaultAvatar.style.display = 'none';
        profileAvatarLarge.src = avatarUrl;
        profileAvatarLarge.style.display = 'block';
      }
      
      // Attempt background push sync when dashboard opens
      syncAttendancesToSupabase();
      syncDebtsToSupabase();
      syncStaffsToSupabase();
      
      // Pull recent 20 records from cloud to populate local db
      pullAttendancesFromSupabase(user.id);
      pullDebtsFromSupabase(user.id);
      pullStaffsFromSupabase();
      
      // Load and render Recent Activity from local DB
      renderRecentActivity(user.id);
      
      // Fetch Notifications
      NotificationService.getNotifications(user.id, 10).then(({ data, error }) => {
        if (!error && data) {
          window.currentNotifications = data;
          const unread = data.filter(n => !n.is_read);
          const badge = document.querySelector('#notification-btn span');
          if (badge) {
            badge.style.display = unread.length > 0 ? 'block' : 'none';
          }
        }
      });
      
      // Real-time listener for incoming notifications
      if (window.notifSubscription) {
        NotificationService.unsubscribeToNotifications(window.notifSubscription);
      }
      window.notifSubscription = NotificationService.subscribeToNotifications(user.id, (newNotif) => {
        // Show Toast instantly
        showToast(`🔔 Baru: ${newNotif.title} - ${newNotif.message}`, 'success');
        
        // Update local state
        window.currentNotifications = window.currentNotifications || [];
        window.currentNotifications.unshift(newNotif);
        
        // Show red badge
        const badge = document.querySelector('#notification-btn span');
        if (badge) badge.style.display = 'block';
      });
    }, 300);
  }

  // Background Async Pull Sync Function
  async function pullAttendancesFromSupabase(userId) {
    try {
      const { data, error } = await AttendanceService.getRecentAttendances(userId, 20);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        let insertedCount = 0;
        for (const record of data) {
          const mappedRecord = {
            ...record,
            timestamp: record.created_at,
            type: record.status
          };
          const didInsert = await insertPulledAttendance(mappedRecord);
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
      
      let failCount = 0;
      let lastError = null;

      for (const record of unsynced) {
        // Attempt pushing to Supabase
        const { error } = await AttendanceService.insertAttendances([{
          user_id: record.user_id,
          created_at: record.timestamp,
          status: record.type
        }]);
        
        if (!error) {
          // Mark SQLite record as synced
          await markAsSynced(record.id);
          console.log(`Synced record ${record.id} to Supabase`);
        } else {
          console.warn('Failed to sync record to Supabase:', error);
          failCount++;
          lastError = error;
        }
      }
      
      if (failCount > 0) {
        showToast(`Failed to sync ${failCount} records. Last error: ${lastError.message}`, 'error');
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
      // Fetch from local SQLite DB for offline consistency
      let localRecords = await getAttendances(userId);
      const recent = localRecords.slice(0, 5);
      
      activityList.innerHTML = ''; // clear loading
      
      if (!recent || recent.length === 0) {
        activityList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:14px; padding:20px;">No recent activity</p>';
        return;
      }
      
      recent.forEach(rec => {
        const dateObj = new Date(rec.timestamp); // local DB uses timestamp
        
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
        
        const isCheckIn = rec.type.includes('Check In'); // local DB uses type
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
          
        const isAdmin = window.currentUserRole === 'Developer' || window.currentUserRole === 'Administrator';
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
