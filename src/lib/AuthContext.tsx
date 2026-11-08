'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, ADMIN_EMAIL, checkIsAdmin } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const determineAdmin = (currentUser: User | null) => {
    if (!currentUser) {
      // Also check local storage for admin override session
      if (typeof window !== 'undefined') {
        const localAdmin = localStorage.getItem('cherry_admin_session');
        if (localAdmin === 'true') {
          setIsAdmin(true);
          return;
        }
      }
      setIsAdmin(false);
      return;
    }
    const adminMatch = checkIsAdmin(currentUser.email);
    setIsAdmin(adminMatch);
    if (adminMatch && typeof window !== 'undefined') {
      localStorage.setItem('cherry_admin_session', 'true');
    }
  };

  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      determineAdmin(data.session?.user || null);
    } catch (err) {
      console.error('Error refreshing session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        determineAdmin(newSession?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cherry_admin_session');
    }
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isLoading,
        signOut: handleSignOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

