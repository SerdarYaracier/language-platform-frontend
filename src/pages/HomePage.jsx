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
      <div className="relative">
        {/* Right-aligned decorative image: horizontally stretched, left side curved like half-circle */}
        <div className="absolute right-0 top-8 z-10 pointer-events-none">
          <div className="w-96 md:w-[28rem] lg:w-[32rem] h-52 md:h-64 lg:h-80 overflow-hidden rounded-l-full shadow-2xl border-l border-cyan-400/30 relative">
            {circleSrc ? (
              <img
                src={circleSrc}
                alt="Language artwork"
                className="w-full h-full object-cover opacity-65"
                // hafif sağa kaydırmak ve kırpılan uçları görünür yapmak için translateX ekledim
                // -> % değerini artırıp azaltarak istediğiniz miktarı ayarlayabilirsiniz
                style={{ transform: 'translateX(8%) scaleX(1.3)', transformOrigin: 'right center' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-800/40 to-purple-800/40 flex items-center justify-center">
                <div className="text-cyan-300 text-4xl">🌐</div>
              </div>
            )}
            {/* Subtle left-to-right gradient for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/8 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
         
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-purple-600/10"></div>
        <div className="relative z-20 px-6 py-16 pb-20 text-left">
           <div className="max-w-4xl mx-auto">
             {/* Main Title - Left aligned */}
             <h1 className="relative z-50 text-5xl lg:text-7xl font-bold mb-6 pb-6 bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent leading-relaxed text-left">
               LingoSolve
             </h1>
             
             <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-2xl leading-relaxed text-left">
               Master languages through interactive<br/>gaming. Fun, fast, and effective <br/> learning awaits you.
             </p>

             {/* Language Badge - Left aligned */}
             <div className="flex justify-start">
               <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-lg">
                 <span className="text-cyan-200">Learning:</span>
                 <span className="font-bold text-white uppercase tracking-wider px-4 py-1 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600">
                   {(targetLang || 'EN').slice(0,2)}
                 </span>
               </div>
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
             {/* Sentence Scramble (with decorative image) */}
             <Link
               to="/categories/sentence-scramble"
               className="group relative overflow-hidden rounded-2xl border border-cyan-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
             >
               <img
                 src={`${SUPABASE_BUCKET_URL}/scramble_gecko.png`}
                 alt="scramble gecko"
                 className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
               <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
               <div className="relative z-10 text-center">
                 <div className="text-4xl mb-4">🧩</div>
                 <h3 className="text-xl font-bold mb-2 text-cyan-100">Sentence Scramble</h3>
                 <p className="text-sm text-cyan-200/80">Rearrange words to form correct sentences</p>
               </div>
             </Link>
             
             {/* Image Match (with decorative image) */}
             <Link
               to="/categories/image-match"
               className="group relative overflow-hidden rounded-2xl border border-purple-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
             >
               <img
                 src={`${SUPABASE_BUCKET_URL}/image-match-gecko.png`}
                 alt="image match gecko"
                 className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
               <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
               <div className="relative z-10 text-center">
                 <div className="text-4xl mb-4">🖼️</div>
                 <h3 className="text-xl font-bold mb-2 text-purple-100">Image Match</h3>
                 <p className="text-sm text-purple-200/80">Match images with their correct words</p>
               </div>
             </Link>

             {/* Fill in the Blank (with decorative image) */}
             <Link
               to="/categories/fill-in-the-blank"
               className="group relative overflow-hidden rounded-2xl border border-emerald-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
             >
               <img
                 src={`${SUPABASE_BUCKET_URL}/fiib_gecko.png`}
                 alt="fill in the blank gecko"
                 className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
               <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
               <div className="relative z-10 text-center">
                 <div className="text-4xl mb-4">✏️</div>
                 <h3 className="text-xl font-bold mb-2 text-emerald-100">Fill in the Blank</h3>
                 <p className="text-sm text-emerald-200/80">Complete sentences with missing words</p>
               </div>
             </Link>

             {/* Mixed Rush (with decorative image) */}
             <Link
               to="/game/mixed-rush"
               className="group relative overflow-hidden rounded-2xl border border-red-400/30 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
             >
               <img
                 src={`${SUPABASE_BUCKET_URL}/mixed-rush_gecko.png`}
                 alt="mixed rush gecko"
                 className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
               <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
               <div className="relative z-10 text-center">
                 <div className="text-4xl mb-4">⚡</div>
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
               <div className="flex items-center justify-center gap-3 mb-6">
                <img
                  src={`${SUPABASE_BUCKET_URL}/cup2_gecko.png`}
                  alt="cup gecko"
                  className="w-14 h-14 rounded-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h3 className="text-2xl lg:text-3xl font-bold text-white text-center">Top Players</h3>
              </div>
               <LeaderboardTable 
                 scores={totalScores}
                 isLoading={isLoadingTotal}
                 maxDisplay={5}
               />
             </div>

             {/* Mixed Rush */}
             <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl">
               <div className="flex items-center justify-center gap-3 mb-6">
                <img
                  src={`${SUPABASE_BUCKET_URL}/lightning_gecko.png`}
                  alt="lightning gecko"
                  className="w-14 h-14 rounded-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h3 className="text-2xl lg:text-3xl font-bold text-white text-center">Mixed Rush</h3>
              </div>
               <LeaderboardTable 
                 
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