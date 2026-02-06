import { supabase } from '../lib/supabase';
import type { Notification } from '../types/database';

// --- Notification Preferences ---

export interface NotificationPreferences {
  jackpot: boolean;
  reminders: boolean;
  friendActivity: boolean;
  security: boolean;
  marketing: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  jackpot: true,
  reminders: true,
  friendActivity: false,
  security: true,
  marketing: false,
};

// --- Notification CRUD ---

export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<{ data: Notification[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function markAsRead(
  notificationId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

export async function markAllAsRead(
  userId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

// --- Notification Preferences ---

export async function getNotificationPreferences(
  userId: string
): Promise<{ data: NotificationPreferences | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (error) return { data: null, error: error.message };

    return {
      data: (data?.notification_preferences as NotificationPreferences) || DEFAULT_PREFERENCES,
      error: null,
    };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: preferences as any })
      .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}
