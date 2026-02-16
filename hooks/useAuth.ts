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

    const handleSession = async (session: Session | null) => {
      if (!mounted) return;

      if (!session) {
        log('[auth] no session, showing landing page');
        setAuthState({ user: null, session: null, loading: false, error: null });
        return;
      }

      log('[auth] valid session, fetching profile...');
      try {
        const user = await fetchProfile(session);
        if (mounted) {
          log('[auth] profile loaded:', user.display_name);
          setAuthState({ user, session, loading: false, error: null });
        }
      } catch (err) {
        // Profile fetch failed but session is valid — use fallback user
        warn('[auth] profile fetch failed, using fallback:', err);
        if (mounted) {
          setAuthState({
            user: constructFallbackUser(session),
            session,
            loading: false,
            error: null,
          });
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log('[auth] onAuthStateChange:', event, { hasSession: !!session });
      if (!mounted) return;

      // INITIAL_SESSION fires once when Supabase finishes reading storage
      // and refreshing the token — this is the primary init path
      if (event === 'INITIAL_SESSION') {
        await handleSession(session);
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
        await handleSession(session);
        return;
      }

      // Signed out — clear everything
      if (event === 'SIGNED_OUT') {
        setAuthState({ user: null, session: null, loading: false, error: null });
        return;
      }

      log('[auth] unhandled auth event:', event);
    });

    // Safety net: if INITIAL_SESSION never fires (shouldn't happen),
    // stop showing the loading spinner after 15 seconds
    const safetyTimeout = setTimeout(() => {
      if (!mounted) return;
      setAuthState(prev => {
        if (prev.loading) {
          warn('[auth] safety timeout — INITIAL_SESSION never fired');
          return { ...prev, loading: false };
        }
        return prev;
      });
    }, 15000);

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
      clearTimeout(safetyTimeout);
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
