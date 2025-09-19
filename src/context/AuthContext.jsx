import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../SupabaseClient';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('[AuthContext] Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
      setUser(session?.user ?? null);
      setLoading(false);
      // when we have a session, fetch profile record from backend
      if (session?.user) {
        fetchProfile().catch(err => console.debug('fetchProfile failed on auth change', err));
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // fetch profile from backend API and store in context
  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile/');
      const data = res.data;
      const p = (Array.isArray(data) && data[0]) || data.profile || data || null;
      setProfile(p);
      return p;
    } catch (err) {
      console.debug('[AuthContext] fetchProfile error', err);
      setProfile(null);
      throw err;
    }
  };

  // Exposed helper to refresh profile from backend
  const refreshProfile = async () => {
    return fetchProfile();
  };

  // Exposed helper to merge small profile updates locally without refetching
  const updateProfile = (patch) => {
    setProfile(prev => ({ ...(prev || {}), ...(patch || {}) }));
  };

  const value = useMemo(() => ({
    user,
    profile,
    refreshProfile,
    updateProfile,
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signUp: (data) => supabase.auth.signUp(data),
    signOut: () => supabase.auth.signOut(),
  }), [user, profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Authenticating...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Diğer bileşenlerden context'e kolayca erişmek için bir custom hook
export function useAuth() {
  return useContext(AuthContext);
}

