import { useContext, useCallback } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import translations, { SUPPORTED_LANGS } from '../i18n/translations';

// simple translator hook: returns t(key, vars) and current app lang
export default function useT() {
  const { appLang } = useContext(LanguageContext);
  const lang = (appLang || 'en').slice(0,2);

  const t = useCallback((key, vars = {}) => {
    const dict = translations[lang] || translations.en;
    let text = dict[key] ?? translations.en[key] ?? key;
    // simple interpolation {var}
    Object.keys(vars).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    });
    return text;
  }, [lang]);

  return { t, lang, supported: SUPPORTED_LANGS };
}
