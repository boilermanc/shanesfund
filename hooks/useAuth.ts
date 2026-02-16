import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { signOut as authSignOut } from '../services/auth';
import type { User } from '../types/database';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const fetchProfile = async (session: Session): Promise<User> => {
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile) return profile;

  // Fallback to constructed user when profile doesn't exist yet
  return {
    id: session.user.id,
    email: session.user.email || '',
    display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
    avatar_url: null,
    subscription_tier: 'free',
    subscription_status: 'inactive',
    stripe_customer_id: null,
    onboarding_completed: false,
    notification_preferences: {},
    savings_goal: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Token refresh doesn't change the user — skip
      if (event === 'TOKEN_REFRESHED') return;

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
        try {
          const user = await fetchProfile(session);
          setAuthState({ user, session, loading: false, error: null });
        } catch {
          setAuthState({ user: null, session, loading: false, error: 'Failed to load profile' });
        }
      } else {
        // SIGNED_OUT, or INITIAL_SESSION with no session
        setAuthState({ user: null, session: null, loading: false, error: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await authSignOut();
    if (!error) {
      setAuthState({ user: null, session: null, loading: false, error: null });
    }
    return { error };
  };

  return { ...authState, signOut };
};

export default useAuth;
