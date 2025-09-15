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
        const totalResponse = await api.get('/api/leaderboard/total-scores?limit=3');
        console.debug('[HomePage] totalResponse:', totalResponse && totalResponse.data ? totalResponse.data : totalResponse);
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
        const mixedResponse = await api.get('/api/leaderboard/mixed-rush?limit=3');
        console.debug('[HomePage] mixedResponse:', mixedResponse && mixedResponse.data ? mixedResponse.data : mixedResponse);
        const limitedMixedScores = (mixedResponse.data || []).slice(0, 3);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 text-white p-6">
      <div className="w-full">
         {/* Header with circular image */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-8 justify-center lg:justify-start">
           {/* Circular image - büyütüldü */}
          <div className="flex-shrink-0 -mt-2 lg:-mt-4">
            <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden border-4 border-cyan-400/30 shadow-2xl bg-cyan-900/20 flex items-center justify-center transition-all duration-500">
               {circleSrc ? (
                <img
                  src={circleSrc}
                  alt="Language artwork"
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
               ) : (
                <div className="text-cyan-300 text-5xl lg:text-6xl">🌐</div>
               )}
             </div>
           </div>
 
           {/* Title text */}
           <div className="flex-1 text-center lg:text-left">
             <h1 className="text-4xl lg:text-5xl font-bold mb-2 leading-tight text-white">
               Welcome to LinguaPlay!
             </h1>
             <p className="text-lg lg:text-xl text-gray-300 mb-4">
               Are you ready to learn a new language by playing games?
             </p>
             <div className="inline-flex items-center gap-3 bg-cyan-900/30 px-4 py-2 rounded-full border border-cyan-400/20">
               <span className="text-sm text-cyan-200">Current language:</span>
               <span className="text-sm font-semibold text-white uppercase px-3 py-1 rounded bg-cyan-600/90">
                 {(targetLang || 'EN').slice(0,2)}
               </span>
             </div>
           </div>
         </div>
        
        {/* Wider layout: left and right columns enlarged so you can add more content on sides */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-x-12 w-full">
          {/* Left expanded area (2 cols) */}
          <div className="lg:col-span-2 px-2">
            <LeaderboardTable 
              title="🏆 Top Players"
              scores={totalScores}
              isLoading={isLoadingTotal}
              maxDisplay={6}
            />
            {/* placeholder area for extra left-side widgets */}
            <div className="mt-6 bg-cyan-900/10 border border-cyan-400/6 rounded-xl p-4">
              {/* add any extra left-side content here */}
            </div>
          </div>

          {/* Center - compact game grid controls */}
          <div className="lg:col-span-1 flex justify-center items-start px-4">
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto mt-8">
              <Link
                to="/categories/sentence-scramble"
                className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold flex items-center justify-center h-16 w-full rounded-xl text-lg transition duration-300 transform hover:scale-[1.02] shadow-lg border border-cyan-400/20"
              >
                Sentence Scramble
              </Link>

              <Link
                to="/categories/image-match"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold flex items-center justify-center h-16 w-full rounded-xl text-lg transition duration-300 transform hover:scale-[1.02] shadow-lg border border-purple-400/20"
              >
                Image Match
              </Link>

              <Link
                to="/categories/fill-in-the-blank"
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold flex items-center justify-center h-16 w-full rounded-xl text-lg transition duration-300 transform hover:scale-[1.02] shadow-lg border border-yellow-400/20"
              >
                Fill in the Blank
              </Link>

              <Link
                to="/game/mixed-rush"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold flex items-center justify-center h-16 w-full rounded-xl text-lg transition duration-300 transform hover:scale-[1.02] shadow-lg border border-red-400/20"
              >
                Mixed Rush
              </Link>
            </div>
          </div>

          {/* Right expanded area (2 cols) */}
          <div className="lg:col-span-2 px-2">
            <LeaderboardTable 
              title="⚡ Mixed Rush"
              scores={mixedRushScores}
              isLoading={isLoadingMixed}
              maxDisplay={6}
            />
            {/* placeholder area for extra right-side widgets */}
            <div className="mt-6 bg-cyan-900/10 border border-cyan-400/6 rounded-xl p-4">
              {/* add any extra right-side content here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;