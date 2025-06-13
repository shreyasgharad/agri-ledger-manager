
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  user_id: string;
  role: 'admin' | 'employee';
  org_id: string;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Profile fetch result:', { profileData, profileError });

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }
      
      // Type cast the role to ensure it matches our Profile interface
      const typedProfile: Profile = {
        ...profileData,
        role: profileData.role as 'admin' | 'employee'
      };
      setProfile(typedProfile);

      if (profileData?.org_id) {
        console.log('Fetching organization:', profileData.org_id);
        
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.org_id)
          .single();

        console.log('Organization fetch result:', { orgData, orgError });

        if (orgError) {
          console.error('Organization fetch error:', orgError);
          throw orgError;
        }
        setOrganization(orgData);
      }
    } catch (error) {
      console.error('Error fetching profile or organization:', error);
      toast({
        title: "Profile Loading Error",
        description: "Failed to load user profile. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setOrganization(null);
          setIsLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('Signing up user:', email);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === 'admin';

  console.log('Auth context state:', { user: !!user, profile: !!profile, organization: !!organization, isLoading });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        isLoading,
        signIn,
        signUp,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
