const fs = require('fs');
let appJs = fs.readFileSync('src/js/app.js', 'utf8');

// Add DOM elements
const elVars = `
  const notificationPanel = document.getElementById('notification-panel');
  const backFromNotificationBtn = document.getElementById('back-from-notification');
  const tabUnread = document.getElementById('tab-unread');
  const tabRead = document.getElementById('tab-read');
  const notifList = document.getElementById('notif-list');
  const unreadCountBadge = document.getElementById('unread-count');
  let currentNotifTab = 'unread';
`;
appJs = appJs.replace(/(const devClearDbBtn = document.getElementById\('dev-clear-db-btn'\);)/, "$1" + elVars);

// Replace the current notificationBtn logic
const oldBtnLogic = /notificationBtn\?\.addEventListener\('click', async \(\) => \{[\s\S]*?\}\);/;
const newBtnLogic = `
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
    
    notifList.innerHTML = filtered.map(n => \`
      <div style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-left: 4px solid \${n.is_read ? '#cbd5e1' : '#4f46e5'};">
        <h4 style="margin: 0 0 5px 0; font-size: 15px; color: #1e293b;">\${n.title}</h4>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; line-height: 1.4;">\${n.message}</p>
        <span style="font-size: 11px; color: #94a3b8;">\${new Date(n.created_at).toLocaleString()}</span>
      </div>
    \`).join('');
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
`;

appJs = appJs.replace(oldBtnLogic, newBtnLogic);

fs.writeFileSync('src/js/app.js', appJs);
