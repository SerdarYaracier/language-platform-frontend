import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../SupabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('[AuthContext] Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Placeholder refreshProfile function for compatibility
  const refreshProfile = () => {
    // This will be used by games to refresh profile after score submission
    console.log('Profile refresh requested');
  };

  const value = useMemo(() => ({
    user,
    refreshProfile,
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signUp: (data) => supabase.auth.signUp(data),
    signOut: () => supabase.auth.signOut(),
  }), [user]);

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

