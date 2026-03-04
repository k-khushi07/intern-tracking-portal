// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== HELPER FUNCTIONS ====================

export const supabaseHelpers = {
  // ========== USER OPERATIONS ==========
  
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUsersByRole(role) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getInternsByPM(pmCode) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'intern')
      .eq('pm_code', pmCode)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ========== REPORT OPERATIONS ==========

  async getAllReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        intern:intern_id (id, full_name, email, intern_id),
        pm:pm_id (id, full_name, pm_code)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getReportsByIntern(internId) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        intern:intern_id (id, full_name, email, intern_id),
        pm:pm_id (id, full_name, pm_code)
      `)
      .eq('intern_id', internId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getReportsByPM(pmId) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        intern:intern_id (id, full_name, email, intern_id),
        pm:pm_id (id, full_name, pm_code)
      `)
      .eq('pm_id', pmId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getPendingReportsByPM(pmId) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        intern:intern_id (id, full_name, email, intern_id),
        pm:pm_id (id, full_name, pm_code)
      `)
      .eq('pm_id', pmId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createReport(reportData) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        ...reportData,
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateReport(id, updates) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        reviewed_at: updates.status ? new Date().toISOString() : undefined
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ========== NOTIFICATION OPERATIONS ==========

  async getNotificationsByUser(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createNotification(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markNotificationAsRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ========== REALTIME SUBSCRIPTIONS ==========

  subscribeToUsers(callback) {
    return supabase
      .channel('users-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, callback)
      .subscribe();
  },

  subscribeToReports(callback) {
    return supabase
      .channel('reports-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports'
      }, callback)
      .subscribe();
  },

  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  },

  // ========== EMAIL INTEGRATION (via Edge Function) ==========

  async sendEmail({ to, subject, html, cc, bcc }) {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, cc, bcc }
    });
    
    if (error) throw error;
    return data;
  }
};