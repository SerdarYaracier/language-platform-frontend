import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import LeaderboardTable from '../components/LeaderboardTable';
import api from '../api';
import { LanguageContext } from '../context/LanguageContext';

const HomePage = () => {
  const { targetLang } = useContext(LanguageContext);

  const [totalScores, setTotalScores] = useState([]);
  const [mixedRushScores, setMixedRushScores] = useState([]);
  const [isLoadingTotal, setIsLoadingTotal] = useState(true);
  const [isLoadingMixed, setIsLoadingMixed] = useState(true);

  // Supabase public bucket base
  const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

  // circle image state for title area
  const [circleSrc, setCircleSrc] = useState(null);

  useEffect(() => {
    // fetch leaderboards
    const fetchLeaderboards = async () => {
      try {
        const totalResponse = await api.get('/api/leaderboard/total-scores?limit=5');
        setTotalScores(totalResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch total scores:', error);
        setTotalScores([
          { username: 'Play some games', score: 0 },
          { username: 'to see rankings', score: 0 },
          { username: 'here!', score: 0 }
        ]);
      } finally {
        setIsLoadingTotal(false);
      }

      try {
        const mixedResponse = await api.get('/api/leaderboard/mixed-rush?limit=5');
        const limitedMixedScores = (mixedResponse.data || []).slice(0, 5);
        setMixedRushScores(limitedMixedScores);
      } catch (error) {
        console.error('Failed to fetch mixed rush scores:', error);
        setMixedRushScores([
          { username: 'Try Mixed Rush', score: 0 },
          { username: 'to compete for', score: 0 },
          { username: 'top scores!', score: 0 }
        ]);
      } finally {
        setIsLoadingMixed(false);
      }
    };

    fetchLeaderboards();
  }, []);

  // watch targetLang and preload image for circle
  useEffect(() => {
    const lang = (targetLang || 'en').slice(0,2);
    const candidate = `${SUPABASE_BUCKET_URL}/169${lang}.png`;
    let mounted = true;
    
    const img = new Image();
    img.onload = () => {
      if (mounted) {
        setCircleSrc(candidate);
        console.debug('[HomePage] circle image loaded:', candidate);
      }
    };
    
    img.onerror = (e) => {
      if (mounted) {
        console.debug('[HomePage] circle image failed to load:', candidate, e);
        setCircleSrc(null);
      }
    };
    
    img.src = candidate;

    return () => {
      mounted = false;
    };
  }, [targetLang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900/30 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
        <div className="relative z-10 px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Language Circle at top center */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-cyan-400/40 shadow-2xl bg-gradient-to-br from-cyan-800/30 to-purple-800/30 flex items-center justify-center backdrop-blur-sm">
                {circleSrc ? (
                  <img
                    src={circleSrc}
                    alt="Language artwork"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-cyan-300 text-6xl">🌐</div>
                )}
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
              LinguaPlay
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Master languages through interactive gaming. Fun, fast, and effective learning awaits you.
            </p>

            {/* Language Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-lg">
              <span className="text-cyan-200">Learning:</span>
              <span className="font-bold text-white uppercase tracking-wider px-4 py-1 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600">
                {(targetLang || 'EN').slice(0,2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Choose Your Game
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sentence Scramble */}
            <Link
              to="/categories/sentence-scramble"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600/20 to-cyan-800/40 border border-cyan-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-cyan-300/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🧩</div>
                <h3 className="text-xl font-bold mb-2 text-cyan-100">Sentence Scramble</h3>
                <p className="text-sm text-cyan-200/80">Rearrange words to form correct sentences</p>
              </div>
            </Link>

            {/* Image Match */}
            <Link
              to="/categories/image-match"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-800/40 border border-purple-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-purple-300/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🖼️</div>
                <h3 className="text-xl font-bold mb-2 text-purple-100">Image Match</h3>
                <p className="text-sm text-purple-200/80">Match images with their correct words</p>
              </div>
            </Link>

            {/* Fill in the Blank */}
            <Link
              to="/categories/fill-in-the-blank"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/40 border border-emerald-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-emerald-300/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">✏️</div>
                <h3 className="text-xl font-bold mb-2 text-emerald-100">Fill in the Blank</h3>
                <p className="text-sm text-emerald-200/80">Complete sentences with missing words</p>
              </div>
            </Link>

            {/* Mixed Rush */}
            <Link
              to="/game/mixed-rush"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 to-red-800/40 border border-red-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-red-300/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <h3 className="text-xl font-bold mb-2 text-red-100">Mixed Rush</h3>
                <p className="text-sm text-red-200/80">Fast-paced mixed game challenges</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboards Section */}
      <div className="px-6 py-16 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Leaderboards
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Players */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl">
              <LeaderboardTable 
                title="🏆 Top Players"
                scores={totalScores}
                isLoading={isLoadingTotal}
                maxDisplay={5}
              />
            </div>

            {/* Mixed Rush */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl">
              <LeaderboardTable 
                title="⚡ Mixed Rush"
                scores={mixedRushScores}
                isLoading={isLoadingMixed}
                maxDisplay={5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats/Features Section */}
      <div className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 rounded-2xl p-6 border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-cyan-100">Targeted Learning</h3>
              <p className="text-cyan-200/80">Focus on specific language skills with categorized exercises</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl p-6 border border-purple-400/20 backdrop-blur-sm">
              <div className="text-3xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold mb-2 text-purple-100">Quick Sessions</h3>
              <p className="text-purple-200/80">Learn in bite-sized 5-10 minute gaming sessions</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 rounded-2xl p-6 border border-emerald-400/20 backdrop-blur-sm">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2 text-emerald-100">Compete & Grow</h3>
              <p className="text-emerald-200/80">Track progress and compete with other learners</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;