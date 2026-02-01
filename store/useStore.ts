import { create } from 'zustand';
import type { User, Pool, Notification } from '../types/database';
interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  // Pools state
  pools: Pool[];
  activePool: Pool | null;
  // UI state
  showWinnerAlert: boolean;
  notifications: Notification[];
  unreadCount: number;
  // Auth actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setOnboarded: (isOnboarded: boolean) => void;
  logout: () => void;
  // Pool actions
  setPools: (pools: Pool[]) => void;
  setActivePool: (pool: Pool | null) => void;
  addPool: (pool: Pool) => void;
  updatePool: (poolId: string, updates: Partial<Pool>) => void;
  removePool: (poolId: string) => void;
  // UI actions
  setWinnerAlert: (show: boolean) => void;
  triggerWinnerAlert: () => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (notificationId: string) => void;
}
export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,
  pools: [],
  activePool: null,
  showWinnerAlert: false,
  notifications: [],
  unreadCount: 0,
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
  logout: () => set({
    user: null,
    isAuthenticated: false,
    isOnboarded: false,
    pools: [],
    activePool: null,
    notifications: [],
    unreadCount: 0,
  }),
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
  markNotificationRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
}));
export default useStore;
