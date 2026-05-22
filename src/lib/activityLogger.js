import { supabase } from './supabase';

/**
 * Logs an activity to the activity_log table.
 * @param {string} user_id - The ID of the user performing the action
 * @param {string} module - The module where the action took place (e.g., 'Work Orders')
 * @param {string} action - The action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} text - A human-readable description of the activity
 */
export const logActivity = async (user_id, module, action, text) => {
  try {
    const { error } = await supabase.from('activity_log').insert([{
      user_id,
      module,
      action,
      text
    }]);
    
    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};
