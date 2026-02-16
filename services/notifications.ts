import { supabase } from '../lib/supabase';
import type { Notification } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

// Alias for backwards compatibility (useStore imports this name)
export { getNotifications as fetchNotifications };

export async function getUnreadCount(
  userId: string
): Promise<{ count: number; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return { count: 0, error: error.message };
    return { count: count || 0, error: null };
  } catch {
    return { count: 0, error: 'An unexpected error occurred' };
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

export async function deleteNotification(
  notificationId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

// --- Realtime Subscriptions ---

let realtimeChannel: RealtimeChannel | null = null;

export function subscribeToNotifications(
  userId: string,
  onNew: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
): RealtimeChannel {
  // Clean up any existing channel first
  unsubscribeFromNotifications();

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onUpdate) onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onDelete) onDelete(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Notification channel error for user:', userId);
      }
    });

  realtimeChannel = channel;
  return channel;
}

export function unsubscribeFromNotifications(): void {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

// --- Send Notifications ---

export async function sendNotification({
  userId,
  type,
  title,
  message,
  data = {},
}: {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
}): Promise<{ data: Notification | null; error: string | null }> {
  try {
    const { data: notif, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: notif as Notification, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function sendPoolNotification({
  poolId,
  type,
  title,
  message,
  data = {},
}: {
  poolId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
}): Promise<{ error: string | null }> {
  try {
    const { data: members, error: membersError } = await supabase
      .from('pool_members')
      .select('user_id')
      .eq('pool_id', poolId);

    if (membersError) return { error: membersError.message };
    if (!members?.length) return { error: 'No pool members found' };

    const notifications = members.map((m) => ({
      user_id: m.user_id,
      type,
      title,
      message,
      data: { ...data, pool_id: poolId },
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

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
