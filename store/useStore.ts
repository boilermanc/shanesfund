
import { create } from 'zustand';
import { AppState, User, Pool } from '../types';

interface ExtendedAppState extends AppState {
  showWinnerAlert: boolean;
  setWinnerAlert: (show: boolean) => void;
  triggerWinnerAlert: () => void;
}

export const useStore = create<ExtendedAppState>((set) => ({
  user: null,
  pools: [],
  isLoading: true,
  isOnboarded: false,
  isAuthenticated: false,
  showWinnerAlert: false,
  setUser: (user) => set({ user }),
  setPools: (pools) => set({ pools }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setWinnerAlert: (showWinnerAlert) => set({ showWinnerAlert }),
  triggerWinnerAlert: () => {
    set({ showWinnerAlert: true });
    setTimeout(() => set({ showWinnerAlert: false }), 5000);
  }
}));
