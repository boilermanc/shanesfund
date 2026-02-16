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
  const now = session.user.created_at || new Date().toISOString();
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
    created_at: now,
    updated_at: now,
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
    let mounted = true;

    // Eagerly check for existing session — resolves immediately even if
    // onAuthStateChange is delayed or never fires (stale/rotated keys)
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !session) {
          // No valid session — clear any stale tokens and stop loading
          if (error) {
            console.warn('Session recovery failed, clearing stale auth:', error.message);
            await supabase.auth.signOut().catch(() => {});
          }
          setAuthState({ user: null, session: null, loading: false, error: null });
          return;
        }

        // Valid session found — load profile
        try {
          const user = await fetchProfile(session);
          if (mounted) {
            setAuthState({ user, session, loading: false, error: null });
          }
        } catch {
          if (mounted) {
            setAuthState({ user: null, session, loading: false, error: 'Failed to load profile' });
          }
        }
      } catch {
        // Network error or client crash — stop loading regardless
        if (mounted) {
          setAuthState({ user: null, session: null, loading: false, error: null });
        }
      }
    };

    initSession();

    // Listen for ongoing auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Skip events that don't change auth state
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_IN' && session) {
        try {
          const user = await fetchProfile(session);
          if (mounted) {
            setAuthState({ user, session, loading: false, error: null });
          }
        } catch {
          if (mounted) {
            setAuthState({ user: null, session, loading: false, error: 'Failed to load profile' });
          }
        }
      } else {
        // SIGNED_OUT
        if (mounted) {
          setAuthState({ user: null, session: null, loading: false, error: null });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
