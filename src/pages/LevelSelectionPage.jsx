import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api'; // Api client
import { LanguageContext } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../SupabaseClient';

// Supabase bucket for decorative level icons
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

const LevelSelectionPage = () => {
  const { gameSlug, categorySlug } = useParams();
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  // keep full auth object and check its `user` property (AuthProvider exposes `user`, not isAuthenticated/isLoading)
  const auth = useAuth();
  const user = auth?.user ?? null;

  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameSlug || !categorySlug) {
      navigate('/categories');
      return;
    }

    const fetchLevels = async () => {
      setIsLoading(true);
      setError('');
      try {
        const resp = await api.get(`/api/games/${gameSlug}/${categorySlug}/levels`, {
          params: { lang: targetLang }
        });
        // Expect backend to return array of { level, is_unlocked, unlock_condition, ... }
        setLevels(Array.isArray(resp.data) ? resp.data : []);
      } catch (err) {
        console.error('Failed to fetch levels', err);
        if (err.response && err.response.status === 401) {
          setError('You must be logged in to view levels.');
        } else if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Could not load levels. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // If there's no authenticated user, don't attempt to fetch levels
    if (!user) {
      console.debug('[LevelSelectionPage] no authenticated user, aborting fetch', { user, auth });
      setError("Please log in to view and unlock levels.");
      setIsLoading(false);
      return;
    }

    console.debug('[LevelSelectionPage] User authenticated, fetching levels:', { 
      user: user?.email || user?.id, 
      gameSlug, 
      categorySlug, 
      targetLang 
    });

    // Test session availability before making the API call
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.debug('[LevelSelectionPage] Session check before API call:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token, 
        tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none',
        error 
      });
      
      // Also test what the API interceptor will get
      console.debug('[LevelSelectionPage] Direct session test for API interceptor compatibility');
    });

    fetchLevels();
  }, [gameSlug, categorySlug, targetLang, navigate, user]);

  const LevelCard = ({ levelData }) => {
    const { level, is_unlocked, unlock_condition } = levelData || {};
    const levelNum = Number(level) || 1;
    const levelImageName = `lvl${levelNum}-gecko.png`;
    const levelImageUrl = `${SUPABASE_BUCKET_URL}/${levelImageName}`;

    if (!is_unlocked) {
      const lockedImageUrl = `${SUPABASE_BUCKET_URL}/locked-gecko.png`;
      return (
        <div
          title={unlock_condition || 'Locked'}
          className="relative bg-gray-800/40 w-52 h-52 flex flex-col items-center justify-center rounded-2xl opacity-80 cursor-not-allowed p-4 shadow-lg border border-gray-700"
        >
          <div className="mb-2 w-24 h-24 flex items-center justify-center overflow-hidden rounded-full bg-gray-700/20 border border-gray-500/20">
            <img src={lockedImageUrl} alt="Locked" className="w-full h-full object-cover block" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-300">L{level}</h2>
          {unlock_condition && <p className="text-xs text-gray-400 mt-2 px-2 text-center">{unlock_condition}</p>}
        </div>
      );
    }

    return (
      <Link
        to={`/game/${gameSlug}/${categorySlug}/${level}`}
        className="block w-52 h-52 bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm rounded-2xl border border-cyan-400/20 shadow-md hover:shadow-2xl transform transition-transform duration-200 hover:scale-105 p-4"
      >
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-cyan-700/20 border border-cyan-300/10 mb-3 overflow-hidden">
            {/* If unlocked and we have level-specific image (1-5), show it; otherwise fall back to text */}
            {is_unlocked && levelNum >= 1 && levelNum <= 5 ? (
              // decorative image for the level
              <img
                src={levelImageUrl}
                alt={`Level ${levelNum}`}
                className="w-full h-full object-cover block"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="text-2xl font-extrabold text-cyan-200">L{level}</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-cyan-100">Level {level}</h3>
          <p className="text-xs text-cyan-200/70 mt-2">Est: {5 + (Number(level) || 1) * 2}m</p>
        </div>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900/10 to-cyan-800/10 p-8">
        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-8 rounded-2xl w-full max-w-lg text-center border border-cyan-400/20 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-lg text-cyan-200">Loading levels...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900/10 to-cyan-800/10 p-8">
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-8 rounded-2xl w-full max-w-md text-center border border-red-400/30">
          <div className="text-3xl text-red-300 mb-4">⚠️</div>
          <div className="text-lg text-red-300 mb-6">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900/8 to-cyan-800/8 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-100">
            Levels
          </h1>
          <p className="text-cyan-200/80">
            Choose a difficulty for <span className="font-semibold text-cyan-300">{categorySlug}</span>
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 mx-auto rounded-full mt-4"></div>
        </header>

        <div className="flex justify-center flex-wrap gap-8">
          {levels.length > 0 ? (
            levels.map((lvl) => <LevelCard key={lvl.level} levelData={lvl} />)
          ) : (
            <p className="text-gray-400 text-xl">No levels found for this category yet.</p>
          )}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600/80 to-cyan-700/80 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/20"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelSelectionPage;