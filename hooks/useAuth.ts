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
      console.log('[auth] initSession started');
      try {
        console.log('[auth] calling getSession...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[auth] getSession returned:', { hasSession: !!session, error: error?.message || null });

        if (!mounted) { console.log('[auth] unmounted, bailing'); return; }

        if (error || !session) {
          if (error) {
            console.warn('[auth] session error, clearing:', error.message);
            await supabase.auth.signOut().catch(() => {});
          } else {
            console.log('[auth] no session found, showing landing page');
          }
          setAuthState({ user: null, session: null, loading: false, error: null });
          return;
        }

        console.log('[auth] valid session for user:', session.user.id);
        try {
          const user = await fetchProfile(session);
          console.log('[auth] profile loaded:', user.display_name);
          if (mounted) {
            setAuthState({ user, session, loading: false, error: null });
          }
        } catch (profileErr) {
          console.error('[auth] fetchProfile failed:', profileErr);
          if (mounted) {
            setAuthState({ user: null, session, loading: false, error: 'Failed to load profile' });
          }
        }
      } catch (outerErr) {
        console.error('[auth] initSession crashed:', outerErr);
        if (mounted) {
          setAuthState({ user: null, session: null, loading: false, error: null });
        }
      }
    };

    console.log('[auth] useEffect running, calling initSession');
    initSession();

    // Listen for ongoing auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] onAuthStateChange:', event, { hasSession: !!session });
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
