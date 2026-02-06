
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  balance: number;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  poolsCount: number;
  lastActive: string;
}

export interface Activity {
  id: string;
  type: 'scan' | 'join' | 'win' | 'contribution' | 'shane';
  user_name: string;
  content: string;
  time: string;
  avatar?: string;
}

export interface Pool {
  id: string;
  name: string;
  total_jackpot: number;
  current_pool_value: number;
  participants_count: number;
  draw_date: string;
  image_url?: string;
  status: 'active' | 'closed' | 'completed';
}

export interface AppState {
  user: User | null;
  pools: Pool[];
  isLoading: boolean;
  isOnboarded: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setPools: (pools: Pool[]) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
}
