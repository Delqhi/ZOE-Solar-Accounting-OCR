import { useState, useEffect, useCallback } from 'react';
import { User } from '../../services/supabaseService';
import * as supabaseService from '../../services/supabaseService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (supabaseService.isSupabaseConfigured()) {
          const currentUser = await supabaseService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await supabaseService.signIn(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await supabaseService.signOut();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
