import { supabase } from '../lib/supabase';
import type { User } from '../types/database';
export interface AuthError {
  message: string;
  status?: number;
}
export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}
// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });
    if (error) {
      return { user: null, error: { message: error.message, status: error.status } };
    }
    if (data.user) {
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));
      // Try to fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileError) {
        // If RLS blocks us, construct user from auth data
        console.log('Profile fetch error, using auth data:', profileError.message);
        const constructedUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          display_name: displayName,
          avatar_url: null,
          subscription_tier: 'free',
          subscription_status: 'inactive',
          stripe_customer_id: null,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { user: constructedUser, error: null };
      }
      return { user: profile, error: null };
    }
    return { user: null, error: null };
  } catch (err) {
    console.error('SignUp error:', err);
    return { user: null, error: { message: 'An unexpected error occurred' } };
  }
};
// Sign in with email and password
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { user: null, error: { message: error.message, status: error.status } };
    }
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileError) {
        console.log('Profile fetch error:', profileError.message);
        // Construct user from auth data as fallback
        const constructedUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          display_name: data.user.user_metadata?.full_name || email.split('@')[0],
          avatar_url: null,
          subscription_tier: 'free',
          subscription_status: 'inactive',
          stripe_customer_id: null,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { user: constructedUser, error: null };
      }
      return { user: profile, error: null };
    }
    return { user: null, error: null };
  } catch (err) {
    console.error('SignIn error:', err);
    return { user: null, error: { message: 'An unexpected error occurred' } };
  }
};
// Sign out
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'An unexpected error occurred' } };
  }
};
// Get current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};
// Get current user profile
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { user: null, error: null };
    }
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) {
      console.log('getCurrentUser profile error:', profileError.message);
      // Construct user from auth data as fallback
      const constructedUser: User = {
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: null,
        subscription_tier: 'free',
        subscription_status: 'inactive',
        stripe_customer_id: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { user: constructedUser, error: null };
    }
    return { user: profile, error: null };
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return { user: null, error: { message: 'An unexpected error occurred' } };
  }
};
// Update user profile
export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      return { user: null, error: { message: error.message } };
    }
    return { user: data, error: null };
  } catch (err) {
    return { user: null, error: { message: 'An unexpected error occurred' } };
  }
};
// Reset password
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'An unexpected error occurred' } };
  }
};
// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        callback(profile);
      } else {
        // Fallback to constructed user
        const constructedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatar_url: null,
          subscription_tier: 'free',
          subscription_status: 'inactive',
          stripe_customer_id: null,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        callback(constructedUser);
      }
    } else {
      callback(null);
    }
  });
};
