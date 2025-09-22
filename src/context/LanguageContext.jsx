import React, { createContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

// Context'i oluşturuyoruz
export const LanguageContext = createContext();

// Provider bileşenini oluşturuyoruz. Bu, tüm uygulamamızı saracak.
export const LanguageProvider = ({ children }) => {
  // Başlangıç dillerini burada belirliyoruz
  // Initialize from localStorage when available so selection persists across F5
  const storedTarget = typeof window !== 'undefined' ? localStorage.getItem('targetLang') : null;
  const storedSource = typeof window !== 'undefined' ? localStorage.getItem('sourceLang') : null;

  const [targetLang, setTargetLang] = useState(storedTarget || 'en'); // Öğrenilen dil
  const [sourceLang, setSourceLang] = useState(storedSource || 'tr'); // Ana dil (ileride kullanılacak)

  // setLanguage fonksiyonu, dil kodlarını güncelleyecek
  const auth = useAuth && useAuth();
  // NOTE: persisting to server is opt-in because backend may not expose a generic update endpoint.
  // Set persistToServer to true only if your backend provides a matching route.
  const setLanguage = async (source, target, options = { persistToServer: false }) => {
    setSourceLang(source);
    setTargetLang(target);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sourceLang', source);
        localStorage.setItem('targetLang', target);
      }
    } catch (e) {
      // ignore storage errors
      console.warn('Failed to persist language to localStorage', e);
    }

    // If user is signed in and server persistence is requested, call API to update profile
    try {
      const user = auth?.user || null;
      const updateProfileLocal = auth?.updateProfile || null;
      const refreshProfile = auth?.refreshProfile || null;
      if (user?.id && options.persistToServer) {
        // best-effort server update; backend route may differ — ignore failures
        try {
          await api.post('/api/profile/update-language', { user_id: user.id, source_language: source, target_language: target });
          if (updateProfileLocal) updateProfileLocal({ source_language: source, target_language: target });
          if (refreshProfile) refreshProfile().catch(() => {});
        } catch (err) {
          console.warn('Failed to persist language to server profile', err);
        }
      }
    } catch (err) {
      console.warn('Language persistence side-effect failed', err);
    }
  };

  // keep storage and state consistent if other tabs changed localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'targetLang' && e.newValue) setTargetLang(e.newValue);
      if (e.key === 'sourceLang' && e.newValue) setSourceLang(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Değerlerin gereksiz yere render olmasını önlemek için useMemo kullanıyoruz
  const value = useMemo(() => ({
    sourceLang,
    targetLang,
    setLanguage,
  }), [sourceLang, targetLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};