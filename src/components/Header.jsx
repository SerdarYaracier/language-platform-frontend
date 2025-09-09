import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext'; // useAuth hook'unu import et
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';

const Header = () => {
  const { targetLang, setLanguage } = useContext(LanguageContext);
  const { user, signOut } = useAuth(); // Auth context'inden user ve signOut'u al
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login'); // Çıkış yaptıktan sonra login sayfasına yönlendir
  };

  // ... handleLanguageChange ve supportedLanguages aynı ...

  return (
    <>
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* App name / logo on the left */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold text-cyan-400">Language Platform</Link>

          {/* Language selector */}
          <div className="ml-4 flex items-center gap-2">
            <label className="text-sm text-gray-300">Language:</label>
            <select
              value={targetLang}
              onChange={(e) => setLanguage('tr', e.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User area */}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300 hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogin(true); }} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <button className="text-gray-400 float-right" onClick={() => setShowLogin(false)}>✕</button>
            <LoginPage
              onClose={() => setShowLogin(false)}
              onOpenSignup={() => { setShowLogin(false); setShowSignup(true); }}
            />
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <button className="text-gray-400 float-right" onClick={() => setShowSignup(false)}>✕</button>
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
