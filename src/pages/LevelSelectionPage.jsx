import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;
// Supabase public bucket for decorative assets
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

const LevelSelectionPage = () => {
  const { gameSlug, categorySlug } = useParams();
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!gameSlug || !categorySlug) return;

    setIsLoading(true);
    setErrorMsg('');
    axios.get(`${API_URL}/api/games/${gameSlug}/${categorySlug}/levels`)
      .then(response => {
        setLevels(response.data || []);
      })
      .catch(error => {
        console.error("Failed to fetch levels", error);
        setErrorMsg('Could not load levels. Please try again later.');
      })
      .finally(() => setIsLoading(false));
  }, [gameSlug, categorySlug]);

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

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900/10 to-cyan-800/10 p-8">
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-8 rounded-2xl w-full max-w-md text-center border border-red-400/30">
          <div className="text-3xl text-red-300 mb-4">⚠️</div>
          <div className="text-lg text-red-300 mb-6">{errorMsg}</div>
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

        {levels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {levels.map((level, idx) => (
              <Link
                key={level}
                to={`/game/${gameSlug}/${categorySlug}/${level}`}
                className="group block transform transition-all duration-300 hover:scale-105"
              >
                <div className="relative overflow-hidden pr-14 bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm rounded-2xl border border-cyan-400/20 shadow-md hover:shadow-2xl h-full">
                  {/* main content above the decorative half-circle */}
                  <div className="relative z-10 p-6 h-full flex flex-col items-center justify-between">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-700/20 border border-cyan-300/10 mb-4 group-hover:scale-105 transition-transform duration-300">
                      <span className="text-2xl font-extrabold text-cyan-200">L{level}</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-cyan-100 mb-2">Level {level}</h3>
                      <p className="text-cyan-200/70 text-sm">Difficulty: {Math.min(Math.max(level,1),10)}</p>
                    </div>
                    <div className="mt-4 w-full">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-block text-sm text-cyan-300/90 bg-cyan-800/30 px-3 py-1 rounded-full border border-cyan-400/10">Play</span>
                        <span className="text-sm text-cyan-200/70">Estimated time: {5 + level * 2}m</span>
                      </div>
                    </div>
                  </div>

                  {/* decorative half-circle on the right, semi-transparent and placed under texts */}
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/4 w-36 h-36 lg:w-44 lg:h-44 rounded-l-full overflow-hidden opacity-40 pointer-events-none z-0">
                    <img
                      src={`${SUPABASE_BUCKET_URL}/hands_down_gecko.png`}
                      alt="decorative gecko"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.objectFit = 'contain'; e.currentTarget.style.background = 'linear-gradient(90deg, rgba(2,6,23,0.2), rgba(6,95,70,0.12))'; }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 p-8 rounded-2xl inline-block border border-cyan-400/20">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-cyan-200">No levels available for this category yet.</p>
            </div>
          </div>
        )}

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