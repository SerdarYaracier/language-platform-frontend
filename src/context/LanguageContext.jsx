import React, { createContext, useState, useMemo } from 'react';

// Context'i oluşturuyoruz
export const LanguageContext = createContext();

// Provider bileşenini oluşturuyoruz. Bu, tüm uygulamamızı saracak.
export const LanguageProvider = ({ children }) => {
  // Başlangıç dillerini burada belirliyoruz
  const [targetLang, setTargetLang] = useState('en'); // Öğrenilen dil
  const [sourceLang, setSourceLang] = useState('tr'); // Ana dil (ileride kullanılacak)

  // setLanguage fonksiyonu, dil kodlarını güncelleyecek
  const setLanguage = (source, target) => {
    setSourceLang(source);
    setTargetLang(target);
  };

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