import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { signOut as authSignOut } from '../services/auth';
import type { User } from '../types/database';
import type { Session } from '@supabase/supabase-js';

const DEBUG = import.meta.env.DEV;
const log = (...args: unknown[]) => { if (DEBUG) console.log(...args); };
const warn = (...args: unknown[]) => { if (DEBUG) console.warn(...args); };

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

/** Race a promise against a timeout. Rejects with 'timeout' if too slow. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

const constructFallbackUser = (session: Session): User => {
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

const fetchProfile = async (session: Session): Promise<User> => {
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile) return profile;

  return constructFallbackUser(session);
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
    let resolved = false;

    const setOnce = (state: AuthState) => {
      if (!mounted || resolved) return;
      resolved = true;
      log('[auth] resolved:', { hasUser: !!state.user, loading: state.loading });
      setAuthState(state);
    };

    const handleSession = async (session: Session | null) => {
      if (!session) {
        log('[auth] no session, showing landing page');
        setOnce({ user: null, session: null, loading: false, error: null });
        return;
      }

      log('[auth] valid session, fetching profile...');
      try {
        const user = await withTimeout(fetchProfile(session), 10000);
        log('[auth] profile loaded:', user.display_name);
        setOnce({ user, session, loading: false, error: null });
      } catch {
        // Profile fetch failed/timed out but session is valid — use fallback
        warn('[auth] profile fetch failed, using fallback user');
        setOnce({ user: constructFallbackUser(session), session, loading: false, error: null });
      }
    };

    // Primary path: call getSession directly
    const initSession = async () => {
      log('[auth] initSession started');
      try {
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          15000
        );
        log('[auth] getSession returned:', { hasSession: !!session, error: error?.message });

        if (error) {
          warn('[auth] session error:', error.message);
        }

        await handleSession(error ? null : session);
      } catch {
        // Timeout — don't destroy the session, just stop loading.
        // onAuthStateChange may still recover if token refresh completes.
        warn('[auth] getSession timed out, stopping loader');
        setOnce({ user: null, session: null, loading: false, error: null });
      }
    };

    initSession();

    // Listen for ongoing auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log('[auth] onAuthStateChange:', event, { hasSession: !!session });
      if (!mounted) return;

      // INITIAL_SESSION — use as fallback if initSession hasn't resolved yet
      if (event === 'INITIAL_SESSION') {
        if (!resolved) {
          await handleSession(session);
        }
        return;
      }

      // Token refreshed — update session silently, keep existing user
      if (event === 'TOKEN_REFRESHED') {
        if (session) {
          setAuthState(prev => ({ ...prev, session }));
        }
        return;
      }

      // Signed in or user updated — (re)fetch profile
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        try {
          const user = await withTimeout(fetchProfile(session), 10000);
          if (mounted) {
            setAuthState({ user, session, loading: false, error: null });
          }
        } catch {
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              user: prev.user || constructFallbackUser(session),
              session,
              loading: false,
            }));
          }
        }
        return;
      }

      // Signed out — clear everything
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setAuthState({ user: null, session: null, loading: false, error: null });
        }
        return;
      }

      log('[auth] unhandled auth event:', event);
    });

    // Re-validate session when the app returns from background
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !mounted) return;
      log('[auth] app became visible, refreshing session...');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          warn('[auth] visibility recovery failed:', error.message);
          return;
        }
        if (session) {
          setAuthState(prev => prev.session ? { ...prev, session } : prev);
        }
      });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
