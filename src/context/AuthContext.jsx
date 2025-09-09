import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../SupabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa ilk yüklendiğinde mevcut oturumu kontrol et
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Oturum durumundaki değişiklikleri dinle (login, logout vb.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Component unmount olduğunda listener'ı temizle
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Supabase fonksiyonlarını sarmalayan değerler
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
  };

  // Yükleme tamamlanana kadar çocuk bileşenleri render etme
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Bu custom hook, bileşenlerden context'e kolayca erişmemizi sağlar
export const useAuth = () => {
  return useContext(AuthContext);
};




