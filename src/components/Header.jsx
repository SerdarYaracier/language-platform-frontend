import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext'; // useAuth hook'unu import et
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import api from '../api';

const Header = () => {
  const { targetLang, setLanguage } = useContext(LanguageContext);
  const { user, signOut } = useAuth(); // Auth context'inden user ve signOut'u al
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login'); // Çıkış yaptıktan sonra login sayfasına yönlendir
  };

  // Supabase public bucket URL'i
  const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';
  // normalize avatar value -> absolute URL
  const normalizeAvatar = (raw) => {
    if (!raw) return null;
    if (/^https?:\/\//.test(raw)) return raw;
    return `${SUPABASE_BUCKET_URL}/${raw.replace(/^\/+/, '')}`;
  };
 
  // Dil seçenekleri bayrak fotoğrafları ile
  const languageOptions = [
    { code: 'en', name: 'English', flag: `${SUPABASE_BUCKET_URL}/en.png` },
    { code: 'tr', name: 'Türkçe', flag: `${SUPABASE_BUCKET_URL}/tr.png` },
    { code: 'ja', name: '日本語', flag: `${SUPABASE_BUCKET_URL}/ja.png` },
    { code: 'es', name: 'Español', flag: `${SUPABASE_BUCKET_URL}/es.png` }
  ];
 
  const currentLanguage = languageOptions.find(lang => lang.code === targetLang);
 
  // Background image'i body'ye uygula - seçili dile göre
  useEffect(() => {
    if (currentLanguage?.flag) {
      // Body'ye background image uygula
      document.body.style.backgroundImage = `url('${currentLanguage.flag}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.minHeight = '100vh';
      
      console.log('Background set to:', currentLanguage.flag);
    }

    // Cleanup function - component unmount olduğunda background'u temizle
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.minHeight = '';
    };
  }, [currentLanguage?.flag]);

  const handleLanguageChange = (langCode) => {
    setLanguage('tr', langCode);
    setShowLanguageDropdown(false);
  };

  // helper: try a few common fields for user's avatar, fallback to placeholder
  const getUserAvatarCandidate = () => {
    // prefer profile.avatar_url if present on profile record, otherwise common fields
    const raw =
      user?.profile?.avatar_url ||
      user?.photoURL ||
      user?.avatar ||
      user?.profile?.avatar ||
      user?.user_metadata?.avatar_url ||
      null;
    return normalizeAvatar(raw) || null;
  };
   
  // state + ref to avoid flicker: remember broken URLs so we don't switch back to them
  const brokenAvatarsRef = React.useRef(new Set());
  const [avatarSrc, setAvatarSrc] = React.useState(() => getUserAvatarCandidate() || '/default-avatar.png');
 
  // If auth.user lacks profile.avatar_url, fetch profile record and use its avatar_url
  useEffect(() => {
    let mounted = true;
    const candidate = getUserAvatarCandidate();
    if (candidate && !brokenAvatarsRef.current.has(candidate)) {
      setAvatarSrc(candidate);
    }

    const fetchProfileAvatar = async () => {
      if (!user) return;
      try {
        const res = await api.get('/api/profile/');
        const data = res.data;
        const profile = (Array.isArray(data) && data[0]) || data.profile || data;
        const raw = profile?.avatar_url;
        const normalized = normalizeAvatar(raw);
        if (mounted && normalized && !brokenAvatarsRef.current.has(normalized)) {
          setAvatarSrc(normalized);
        }
      } catch (err) {
        // silently ignore - keep existing avatarSrc
        console.debug('Header: failed to fetch profile for avatar', err);
      }
    };

    fetchProfileAvatar();
    return () => { mounted = false; };
  // react when user or underlying avatar fields change
  }, [user?.profile?.avatar_url, user?.photoURL, user?.avatar, user?.profile?.avatar, user?.user_metadata?.avatar_url, user]);

  return (
    <>
    <header className="bg-gradient-to-r from-cyan-900 via-cyan-800 to-cyan-900 text-white shadow-2xl backdrop-blur-sm border-b border-cyan-400/30 relative z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* App name / logo on the left */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold text-cyan-300 hover:text-cyan-100 transition-all duration-300 transform hover:scale-105 drop-shadow-lg">
            Language Platform
          </Link>

          {/* Language selector with flags */}
          <div className="ml-4 flex items-center gap-2 relative">
            <label className="text-sm text-cyan-200 font-medium">Language:</label>
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30 backdrop-blur-sm z-50"
                aria-haspopup="true"
                aria-expanded={showLanguageDropdown}
              >
                <img 
                  src={currentLanguage?.flag} 
                  alt={currentLanguage?.name}
                  className="w-5 h-4 object-cover rounded shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="text-sm font-medium text-cyan-100">{currentLanguage?.name}</span>
                <svg className={`w-4 h-4 ml-1 text-cyan-200 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-gradient-to-b from-cyan-800 to-cyan-900 rounded-lg shadow-2xl z-60 min-w-[160px] border border-cyan-400/30 backdrop-blur-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {languageOptions.map((lang, index) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-cyan-600/50 transition-all duration-200 transform hover:scale-[1.02] ${
                        lang.code === targetLang ? 'bg-cyan-600/70 border-l-4 border-l-cyan-300' : ''
                      } ${index === 0 ? 'rounded-t-lg' : ''} ${index === languageOptions.length - 1 ? 'rounded-b-lg' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <img 
                        src={lang.flag} 
                        alt={lang.name}
                        className="w-6 h-5 object-cover rounded shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="text-sm font-medium text-cyan-100">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MOVED: Leaderboards button immediately to the right of language selector */}
          <Link
            to="/leaderboards"
            className="ml-2 text-sm text-cyan-200 hover:text-cyan-100 font-medium transition-all duration-300 transform hover:scale-105 px-3 py-2 rounded-lg hover:bg-cyan-700/30 backdrop-blur-sm z-50"
          >
            Leaderboards
          </Link>
        </div>

        {/* ...existing center/right layout preserved... */}
        <div className="flex items-center gap-4">
          {/* placeholder kept empty to retain layout balance */}
        </div>

        <div className="flex items-center gap-4">
          {/* User area - show profile photo instead of email */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" title={user.email} className="block">
                <img
                  src={avatarSrc}
                  alt={user.email || 'Profile'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-300 shadow-md transition-transform duration-200 hover:scale-105"
                  onError={(e) => {
                    // mark this url as broken and switch to default permanently
                    brokenAvatarsRef.current.add(e.target.src);
                    setAvatarSrc('/default-avatar.png');
                  }}
                />
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-red-400/30 backdrop-blur-sm hover:shadow-red-500/25"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogin(true); }} 
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-300/30 backdrop-blur-sm hover:shadow-cyan-400/25"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown dışına tıklanınca kapat */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLanguageDropdown(false)}
        />
      )}
    </header>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-cyan-900 to-cyan-800 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-cyan-400/30 backdrop-blur-lg animate-in zoom-in-95 duration-300">
            <button className="text-cyan-300 hover:text-cyan-100 float-right text-xl transition-all duration-200 transform hover:scale-110" onClick={() => setShowLogin(false)}>✕</button>
            <LoginPage
              onClose={() => setShowLogin(false)}
              onOpenSignup={() => { setShowLogin(false); setShowSignup(true); }}
            />
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-cyan-900 to-cyan-800 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-cyan-400/30 backdrop-blur-lg animate-in zoom-in-95 duration-300">
            <button className="text-cyan-300 hover:text-cyan-100 float-right text-xl transition-all duration-200 transform hover:scale-110" onClick={() => setShowSignup(false)}>✕</button>
            <SignUpPage
              onClose={() => setShowSignup(false)}
              onOpenLogin={() => { setShowSignup(false); setShowLogin(true); }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
