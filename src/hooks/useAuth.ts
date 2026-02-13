/**
 * 🔱 ULTRA 2026 - Authentication Hook
 * Type-safe auth with Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { type UserId, type Email } from '@/lib/ultra';
import { supabase } from '@/services/supabaseClient';

export interface User {
  id: UserId;
  email: Email;
  name?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  session: Session | null;
}

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    session: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setState({
            user: {
              id: session.user.id as UserId,
              email: session.user.email as Email,
              name: session.user.user_metadata?.name,
              avatar: session.user.user_metadata?.avatar_url,
            },
            loading: false,
            error: null,
            session,
          });
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
            session: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error as Error,
          session: null,
        });
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({
          user: {
            id: session.user.id as UserId,
            email: session.user.email as Email,
            name: session.user.user_metadata?.name,
            avatar: session.user.user_metadata?.avatar_url,
          },
          loading: false,
          error: null,
          session,
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
          session: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session?.user) {
        setState({
          user: {
            id: data.session.user.id as UserId,
            email: data.session.user.email as Email,
            name: data.session.user.user_metadata?.name,
            avatar: data.session.user.user_metadata?.avatar_url,
          },
          loading: false,
          error: null,
          session: data.session,
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        loading: false,
        error: null,
        session: null,
      });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: name ? { name } : undefined,
        },
      });

      if (error) throw error;

      if (data?.session?.user) {
        setState({
          user: {
            id: data.session.user.id as UserId,
            email: data.session.user.email as Email,
            name: data.session.user.user_metadata?.name,
            avatar: data.session.user.user_metadata?.avatar_url,
          },
          loading: false,
          error: null,
          session: data.session,
        });
      } else {
        // Email confirmation required
        setState({
          user: null,
          loading: false,
          error: null,
          session: null,
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  }, []);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    register,
    resetPassword,
  };
}

/**
 * Admin check hook
 */
export function useAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user || loading) {
      setIsAdmin(false);
      return;
    }

    // Check if user has admin role
    // In production, this would query the database
    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!error && data !== null);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  return { isAdmin };
}

/**
 * Session refresh helper
 */
export async function refreshSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user ID safely
 */
export function getCurrentUserId(): UserId | null {
  const { user } = useAuth();
  return user?.id || null;
}
