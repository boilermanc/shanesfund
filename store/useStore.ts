import { create } from 'zustand';
import type { User, Activity, Notification } from '../types/database';
import type { PoolWithMembers } from '../services/pools';
import type { FriendWithProfile, PoolWithFriendCount } from '../services/friends';
import * as friendsService from '../services/friends';
import {
  fetchNotifications as fetchNotificationsApi,
  getUnreadCount as getUnreadCountApi,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../services/notifications';

// Helper: format a date string as relative time ("5m ago", "2h ago", etc.)
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Helper: map an activity_log action + details to a display-friendly type and content
function mapActionToActivity(
  action: string,
  details: Record<string, any>
): { type: Activity['type']; content: string } {
  if (details?.message) {
    return { type: mapActionType(action), content: details.message };
  }

  const poolName = details?.pool_name || details?.poolName;

  switch (action) {
    case 'ticket_scanned':
    case 'scan':
      return { type: 'scan', content: `scanned a ticket${poolName ? ` for "${poolName}"` : ''}.` };
    case 'pool_joined':
    case 'join':
      return { type: 'join', content: `joined "${poolName || 'a pool'}".` };
    case 'win_detected':
    case 'win':
      return { type: 'win', content: `won${details?.amount ? ` $${details.amount}` : ''}!` };
    case 'contribution_made':
    case 'contribution':
      return { type: 'contribution', content: `contributed to "${poolName || 'a pool'}".` };
    default:
      return { type: 'scan', content: details?.content || action.replace(/_/g, ' ') + '.' };
  }
}

function mapActionType(action: string): Activity['type'] {
  if (action.includes('scan') || action.includes('ticket')) return 'scan';
  if (action.includes('join')) return 'join';
  if (action.includes('win')) return 'win';
  if (action.includes('contribut') || action.includes('payment')) return 'contribution';
  return 'scan';
}
interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  // Pools state
  pools: PoolWithMembers[];
  activePool: PoolWithMembers | null;
  // Friends state
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[];
  sentRequests: FriendWithProfile[];
  friendsLoading: boolean;
  // Activity feed state
  activities: Activity[];
  activitiesLoading: boolean;
  // Mutual pools state
  mutualPools: PoolWithFriendCount[];
  mutualPoolsLoading: boolean;
  // Shared wealth state
  sharedWealth: number;
  sharedWealthLoading: boolean;
  // UI state
  showWinnerAlert: boolean;
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  // Toast state
  toast: { message: string; type: 'info' | 'success' | 'error' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  // Auth actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setOnboarded: (isOnboarded: boolean) => void;
  logout: () => void;
  // Pool actions
  setPools: (pools: PoolWithMembers[]) => void;
  setActivePool: (pool: PoolWithMembers | null) => void;
  addPool: (pool: PoolWithMembers) => void;
  updatePool: (poolId: string, updates: Partial<PoolWithMembers>) => void;
  removePool: (poolId: string) => void;
  // Friends actions
  fetchFriends: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  fetchSentRequests: (userId: string) => Promise<void>;
  sendFriendRequest: (userId: string, friendId: string) => Promise<{ error: string | null }>;
  acceptFriendRequest: (friendshipId: string, userId: string) => Promise<{ error: string | null }>;
  declineFriendRequest: (friendshipId: string, userId: string) => Promise<{ error: string | null }>;
  removeFriend: (friendshipId: string, userId: string) => Promise<{ error: string | null }>;
  // Activity feed actions
  fetchFriendActivity: (userId: string) => Promise<void>;
  // Mutual pools actions
  fetchMutualPools: (userId: string) => Promise<void>;
  // Shared wealth actions
  fetchSharedWealth: (userId: string) => Promise<void>;
  // UI actions
  setWinnerAlert: (show: boolean) => void;
  triggerWinnerAlert: () => void;
  setNotifications: (notifications: Notification[]) => void;
  loadNotifications: (userId: string) => Promise<void>;
  startNotificationListener: (userId: string) => void;
  stopNotificationListener: () => void;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
}

let _toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,
  pools: [],
  activePool: null,
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  friendsLoading: false,
  activities: [],
  activitiesLoading: false,
  mutualPools: [],
  mutualPoolsLoading: false,
  sharedWealth: 0,
  sharedWealthLoading: false,
  showWinnerAlert: false,
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,
  // Toast
  toast: null,
  showToast: (message, type = 'info') => {
    if (_toastTimer) clearTimeout(_toastTimer);
    set({ toast: { message, type } });
    _toastTimer = setTimeout(() => {
      set({ toast: null });
      _toastTimer = null;
    }, 3000);
  },
  // Auth actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isOnboarded: user?.onboarding_completed ?? false,
  }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboarded: (isOnboarded) => {
    set({ isOnboarded });
  },
  logout: () => {
    unsubscribeFromNotifications();
    set({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      pools: [],
      activePool: null,
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      friendsLoading: false,
      activities: [],
      activitiesLoading: false,
      mutualPools: [],
      mutualPoolsLoading: false,
      sharedWealth: 0,
      sharedWealthLoading: false,
      notifications: [],
      unreadCount: 0,
      notificationsLoading: false,
    });
  },
  // Pool actions
  setPools: (pools) => set({ pools }),
  setActivePool: (activePool) => set({ activePool }),
  addPool: (pool) => set((state) => ({ 
    pools: [...state.pools, pool] 
  })),
  updatePool: (poolId, updates) => set((state) => ({
    pools: state.pools.map((p) => 
      p.id === poolId ? { ...p, ...updates } : p
    ),
    activePool: state.activePool?.id === poolId 
      ? { ...state.activePool, ...updates } 
      : state.activePool,
  })),
  removePool: (poolId) => set((state) => ({
    pools: state.pools.filter((p) => p.id !== poolId),
    activePool: state.activePool?.id === poolId ? null : state.activePool,
  })),
  // Friends actions
  fetchFriends: async (userId) => {
    set({ friendsLoading: true });
    const { data, error } = await friendsService.getFriends(userId);
    set({
      friends: data || [],
      friendsLoading: false,
    });
    if (error) {
      console.error('Failed to fetch friends:', error);
    }
  },
  fetchPendingRequests: async (userId) => {
    const { data, error } = await friendsService.getPendingRequests(userId);
    if (!error) {
      set({ pendingRequests: data || [] });
    }
  },
  fetchSentRequests: async (userId) => {
    const { data, error } = await friendsService.getSentRequests(userId);
    if (!error) {
      set({ sentRequests: data || [] });
    }
  },
  sendFriendRequest: async (userId, friendId) => {
    const { data, error } = await friendsService.sendFriendRequest(userId, friendId);
    if (!error && data) {
      if (data.status === 'accepted') {
        get().fetchFriends(userId);
      }
      get().fetchSentRequests(userId);
    }
    return { error };
  },
  acceptFriendRequest: async (friendshipId, userId) => {
    const { error } = await friendsService.acceptFriendRequest(friendshipId);
    if (!error) {
      get().fetchFriends(userId);
      get().fetchPendingRequests(userId);
    }
    return { error };
  },
  declineFriendRequest: async (friendshipId, userId) => {
    const { error } = await friendsService.declineFriendRequest(friendshipId);
    if (!error) {
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== friendshipId),
      }));
    }
    return { error };
  },
  removeFriend: async (friendshipId, userId) => {
    const { error } = await friendsService.removeFriend(friendshipId);
    if (!error) {
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendshipId),
      }));
    }
    return { error };
  },
  // Activity feed actions
  fetchFriendActivity: async (userId) => {
    set({ activitiesLoading: true });
    const state = get();
    const friendIds = state.friends.map((f) => f.userId);
    const allIds = [userId, ...friendIds];

    const { data, error } = await friendsService.getFriendActivity(allIds);

    if (error || !data) {
      set({ activities: [], activitiesLoading: false });
      return;
    }

    // Build user lookup from friends list + current user
    const userMap = new Map<string, { name: string; avatar?: string }>();
    for (const f of state.friends) {
      userMap.set(f.userId, { name: f.displayName, avatar: f.avatarUrl || undefined });
    }
    if (state.user) {
      userMap.set(state.user.id, {
        name: state.user.display_name || state.user.email.split('@')[0],
        avatar: state.user.avatar_url || undefined,
      });
    }

    const activities: Activity[] = data
      .filter((row) => row.user_id)
      .map((row) => {
        const userData = userMap.get(row.user_id!) || { name: 'Someone' };
        const details =
          typeof row.details === 'object' && row.details !== null
            ? (row.details as Record<string, any>)
            : {};
        const { type, content } = mapActionToActivity(row.action, details);

        return {
          id: row.id,
          type,
          user_name: userData.name,
          content,
          time: timeAgo(row.created_at),
          avatar: userData.avatar,
        };
      });

    set({ activities, activitiesLoading: false });
  },
  // Mutual pools actions
  fetchMutualPools: async (userId) => {
    set({ mutualPoolsLoading: true });
    const friendIds = get().friends.map((f) => f.userId);
    const { data, error } = await friendsService.getPoolsWithFriendCounts(userId, friendIds);

    if (error) {
      console.error('Failed to fetch mutual pools:', error);
    }

    set({ mutualPools: data || [], mutualPoolsLoading: false });
  },
  // Shared wealth actions
  fetchSharedWealth: async (userId) => {
    set({ sharedWealthLoading: true });
    const { data, error } = await friendsService.getSharedWealth(userId);

    if (error) {
      console.error('Failed to fetch shared wealth:', error);
    }

    set({ sharedWealth: data || 0, sharedWealthLoading: false });
  },
  // UI actions
  setWinnerAlert: (showWinnerAlert) => set({ showWinnerAlert }),
  triggerWinnerAlert: () => {
    set({ showWinnerAlert: true });
    setTimeout(() => set({ showWinnerAlert: false }), 5000);
  },
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  }),
  loadNotifications: async (userId) => {
    set({ notificationsLoading: true });
    const [notifResult, countResult] = await Promise.all([
      fetchNotificationsApi(userId),
      getUnreadCountApi(userId),
    ]);
    set({
      notifications: notifResult.data || [],
      unreadCount: countResult.count ?? 0,
      notificationsLoading: false,
    });
    if (notifResult.error) {
      console.error('Failed to fetch notifications:', notifResult.error);
    }
    if (countResult.error) {
      console.error('Failed to fetch unread count:', countResult.error);
    }
  },
  startNotificationListener: (userId) => {
    subscribeToNotifications(
      userId,
      (payload) => {
        const newNotif = payload.new as Notification;
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          unreadCount: newNotif.read ? state.unreadCount : state.unreadCount + 1,
        }));
      },
      (payload) => {
        const updated = payload.new as Notification;
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === updated.id ? updated : n
          );
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter((n) => !n.read).length,
          };
        });
      },
      (payload) => {
        const old = payload.old as { id: string };
        set((state) => {
          const existing = state.notifications.find((n) => n.id === old.id);
          const wasUnread = existing && !existing.read;
          return {
            notifications: state.notifications.filter((n) => n.id !== old.id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      }
    );
  },
  stopNotificationListener: () => {
    unsubscribeFromNotifications();
  },
  markNotificationRead: async (notificationId) => {
    const { error } = await markAsRead(notificationId);
    if (error) {
      console.error('Failed to mark notification as read:', error);
      return;
    }
    set((state) => {
      const notif = state.notifications.find((n) => n.id === notificationId);
      const wasUnread = notif && !notif.read;
      return {
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },
  markAllNotificationsRead: async (userId) => {
    const { error } = await markAllAsRead(userId);
    if (error) {
      console.error('Failed to mark all notifications as read:', error);
      return;
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  removeNotification: async (notificationId) => {
    const { error } = await deleteNotification(notificationId);
    if (error) {
      console.error('Failed to delete notification:', error);
      return;
    }
    set((state) => {
      const notif = state.notifications.find((n) => n.id === notificationId);
      const wasUnread = notif && !notif.read;
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },
}));
export default useStore;
