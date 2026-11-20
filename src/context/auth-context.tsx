import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database, UserRole } from '@/types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

interface ManagerInfo {
  id: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  manager: ManagerInfo | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  manager: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        setProfile(null);
        setManager(null);
        return;
      }

      setProfile(userProfile);

      if (userProfile.manager_id) {
        const { data: mgrData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', userProfile.manager_id)
          .single();

        if (mgrData) {
          setManager(mgrData);
        } else {
          setManager(null);
        }
      } else {
        setManager(null);
      }
    } catch {
      setProfile(null);
      setManager(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setManager(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setManager(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async (): Promise<void> => {
    // Clear expo push token before signing out if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ expo_push_token: null })
          .eq('id', user.id);
      } catch {
        // Continue logout even if token clearing fails
      }
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setManager(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        manager,
        role: profile?.role ?? null,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
