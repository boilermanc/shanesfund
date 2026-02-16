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

/** Clear any Supabase auth data from localStorage */
const clearSupabaseStorage = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        log('[auth] removing stale localStorage key:', key);
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage might be unavailable
  }
};

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
    let resolved = false; // prevent both paths from setting state

    const setOnce = (state: AuthState) => {
      if (!mounted || resolved) return;
      resolved = true;
      log('[auth] resolved:', { hasUser: !!state.user, loading: state.loading });
      setAuthState(state);
    };

    const initSession = async () => {
      log('[auth] initSession started');
      try {
        log('[auth] calling getSession (5s timeout)...');
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );
        log('[auth] getSession returned:', { hasSession: !!session, error: error?.message || null });

        if (error || !session) {
          if (error) {
            warn('[auth] session error, clearing:', error.message);
            clearSupabaseStorage();
          } else {
            log('[auth] no session, showing landing page');
          }
          setOnce({ user: null, session: null, loading: false, error: null });
          return;
        }

        log('[auth] valid session, fetching profile (5s timeout)...');
        try {
          const user = await withTimeout(fetchProfile(session), 5000);
          log('[auth] profile loaded:', user.display_name);
          setOnce({ user, session, loading: false, error: null });
        } catch (profileErr) {
          console.error('[auth] fetchProfile failed:', profileErr);
          setOnce({ user: null, session, loading: false, error: 'Failed to load profile' });
        }
      } catch (err) {
        // Timeout or network error — stale session hanging
        warn('[auth] getSession timed out or crashed, clearing stale session');
        clearSupabaseStorage();
        supabase.auth.signOut().catch(() => {});
        setOnce({ user: null, session: null, loading: false, error: null });
      }
    };

    initSession();

    // Listen for ongoing auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log('[auth] onAuthStateChange:', event, { hasSession: !!session });
      if (!mounted) return;

      // Skip initial session — handled by initSession() above
      if (event === 'INITIAL_SESSION') return;

      // Token refreshed — update session in state silently (keep existing user)
      if (event === 'TOKEN_REFRESHED') {
        if (session && mounted) {
          setAuthState(prev => ({ ...prev, session }));
        }
        return;
      }

      // Signed in or user updated — (re)fetch profile
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        try {
          const user = await withTimeout(fetchProfile(session), 5000);
          if (mounted) {
            setAuthState({ user, session, loading: false, error: null });
          }
        } catch {
          if (mounted) {
            // Keep existing user on profile fetch failure, just update session
            setAuthState(prev => ({ ...prev, session, loading: false }));
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

      // Any other event — log but don't change state
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
