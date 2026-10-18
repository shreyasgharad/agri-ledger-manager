import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/supabase/untyped';
import type { AppRole } from '@/types/agri';

/**
 * Roles
 *   admin   – everything: edit advances, profit & loss, settings, users
 *   staff   – view + add farmers, lots, advances, bills, payments
 *   viewer  – view only
 *   pending – signed up, waiting for the admin to approve
 *
 * Until the database flag `roles_enforced` is switched on, the app runs in open mode
 * (no login, everybody is treated as admin) so nobody gets locked out during set-up.
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  enforced: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  canWrite: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [enforced, setEnforced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRole = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRole(null);
      return;
    }
    const { data } = await db.from('profiles').select('role').eq('user_id', userId).maybeSingle();
    const r = (data?.role as string | undefined) ?? 'pending';
    setRole(r === 'employee' ? 'staff' : (r as AppRole));
  }, []);

  useEffect(() => {
    let active = true;

    // Never leave the screen on "Loading..." if the network is slow or fails.
    const safety = setTimeout(() => {
      if (active) setIsLoading(false);
    }, 8000);

    (async () => {
      try {
        const [{ data: flag }, { data: sess }] = await Promise.all([
          db.from('app_flags').select('value').eq('key', 'roles_enforced').maybeSingle(),
          supabase.auth.getSession(),
        ]);
        if (!active) return;
        setEnforced(flag?.value === 'on');
        setSession(sess.session);
        await loadRole(sess.session?.user.id);
      } catch {
        /* fall back to open mode with no session */
      } finally {
        if (active) setIsLoading(false);
        clearTimeout(safety);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // defer: never call the database inside the auth callback itself
      setTimeout(() => {
        loadRole(next?.user.id);
      }, 0);
    });

    return () => {
      active = false;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, [loadRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    await loadRole(session?.user.id);
  };

  // open mode: everybody is an admin
  const effectiveRole: AppRole | null = enforced ? role : 'admin';
  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    role: effectiveRole,
    enforced,
    isLoading,
    isAdmin: effectiveRole === 'admin',
    canWrite: effectiveRole === 'admin' || effectiveRole === 'staff',
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
