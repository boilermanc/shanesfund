import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, onAuthStateChange } from '../services/auth';
import type { User } from '../types/database';
import type { Session } from '@supabase/supabase-js';
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { user, error } = await getCurrentUser();
          setAuthState({
            user,
            session,
            loading: false,
            error: error?.message || null,
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: 'Failed to initialize auth',
        });
      }
    };
    initAuth();
    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAuthState({
          user,
          session,
          loading: false,
          error: null,
        });
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return authState;
};
export default useAuth;
