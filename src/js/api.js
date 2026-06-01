import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    experimental: { passkey: true }
  }
});

// --- Auth Service ---
export const AuthService = {
  async getSession() {
    return await supabase.auth.getSession();
  },
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
  async signInWithOAuth() {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    });
  },
  async signInWithPasskey() {
    return await supabase.auth.signInWithPasskey();
  },
  async registerPasskey() {
    return await supabase.auth.registerPasskey();
  },
  async signOut() {
    return await supabase.auth.signOut();
  },
  async listPasskeys() {
    if (supabase.auth.passkey) {
      return await supabase.auth.passkey.list();
    }
    return { data: null, error: new Error('Passkey not supported') };
  },
  isPasskeySupported() {
    return !!(window.PublicKeyCredential && supabase.auth.passkey);
  }
};

// --- Attendance Service ---
export const AttendanceService = {
  async deleteUserAttendances(userId) {
    return await supabase
      .from('attendances')
      .delete()
      .eq('user_id', userId);
  },
  async insertAttendances(records) {
    return await supabase.from('attendances').insert(records);
  },
  async getAttendancesByDateRange(userId, startDateTime, endDateTime) {
    return await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)
      .order('created_at', { ascending: false });
  },
  async getRecentAttendances(userId, limit = 5) {
    return await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }
};

// --- User Service ---
export const UserService = {
  async getUserRole(userId) {
    return await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
  }
};

// --- Notification Service ---
export const NotificationService = {
  async getNotifications(userId, limit = 10) {
    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },
  async markAllAsRead(userId) {
    return await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },
  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },
  unsubscribeToNotifications(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};

// --- Profile Service ---
export const ProfileService = {
  async getProfile(userId) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
  }
};

// --- Debt Service ---
export const DebtService = {
  async getDebts(userId) {
    return await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },
  async insertDebts(records) {
    return await supabase.from('debts').upsert(records, { onConflict: 'id' });
  },
  async updateDebtStatus(debtId, isPaid) {
    return await supabase
      .from('debts')
      .update({ is_paid: isPaid })
      .eq('id', debtId);
  }
};

// --- Staff Service ---
export const StaffService = {
  async getStaffs(userId) {
    return await supabase
      .from('staffs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },
  async insertStaffs(records) {
    return await supabase.from('staffs').upsert(records, { onConflict: 'id' });
  }
};
