import React, { useContext, useState } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const AppLanguageSelector = () => {
  const { appLang, setAppLang } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);

  const options = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ja', label: '日本語' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <div className="ml-3 relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded px-3 py-2 text-sm text-gray-200 flex items-center gap-2 border border-gray-600"
        aria-haspopup="true"
        aria-expanded={open}
        title="App language"
      >
        App: <span className="ml-2 font-semibold">{(appLang || 'en').toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-lg border border-gray-600 z-50 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.code}
              onClick={() => { setAppLang(opt.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${opt.code === appLang ? 'bg-gray-700 font-semibold' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppLanguageSelector;
