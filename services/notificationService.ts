import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: 'win' | 'invite' | 'payment' | 'reminder' | 'friend_request' | 'pool_update' | 'system';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

let realtimeChannel: RealtimeChannel | null = null;

export async function fetchNotifications(
  userId: string
): Promise<{ data: Notification[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    console.error('fetchNotifications error:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

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
  } catch (err) {
    console.error('getUnreadCount error:', err);
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
  } catch (err) {
    console.error('markAsRead error:', err);
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
  } catch (err) {
    console.error('markAllAsRead error:', err);
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
  } catch (err) {
    console.error('deleteNotification error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

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
}): Promise<Notification | null> {
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

  if (error) {
    console.error('Error sending notification:', error);
    return null;
  }

  return notif as Notification;
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
}): Promise<void> {
  const { data: members, error: membersError } = await supabase
    .from('pool_members')
    .select('user_id')
    .eq('pool_id', poolId);

  if (membersError || !members?.length) {
    console.error('Error fetching pool members:', membersError);
    return;
  }

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

  if (error) {
    console.error('Error sending pool notifications:', error);
  }
}
