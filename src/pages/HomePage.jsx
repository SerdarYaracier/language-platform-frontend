import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Sayfalar arası geçiş için Link bileşenini kullanıyoruz
import LeaderboardTable from '../components/LeaderboardTable';
import api from '../api';

const HomePage = () => {
  const [totalScores, setTotalScores] = useState([]);
  const [mixedRushScores, setMixedRushScores] = useState([]);
  const [isLoadingTotal, setIsLoadingTotal] = useState(true);
  const [isLoadingMixed, setIsLoadingMixed] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
  // Fetch total scores leaderboard
  const totalResponse = await api.get('/api/leaderboard/total-scores?limit=3');
  console.debug('[HomePage] totalResponse:', totalResponse && totalResponse.data ? totalResponse.data : totalResponse);
  setTotalScores(totalResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch total scores:', error);
        // Show placeholder data when endpoint doesn't exist
        setTotalScores([
          { username: 'Play some games', score: 0 },
          { username: 'to see rankings', score: 0 },
          { username: 'here!', score: 0 }
        ]);
      } finally {
        setIsLoadingTotal(false);
      }

      try {
  // Fetch mixed rush leaderboard - limit to 3
  const mixedResponse = await api.get('/api/leaderboard/mixed-rush?limit=3');
  console.debug('[HomePage] mixedResponse:', mixedResponse && mixedResponse.data ? mixedResponse.data : mixedResponse);
  // Ensure we only show top 3
  const limitedMixedScores = (mixedResponse.data || []).slice(0, 3);
  setMixedRushScores(limitedMixedScores);
      } catch (error) {
        console.error('Failed to fetch mixed rush scores:', error);
        // Show placeholder data when endpoint doesn't exist - only 3 items
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
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4">
          Welcome to LinguaPlay!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Are you ready to learn a new language by playing games?
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-x-24 max-w-7xl mx-auto">
        {/* Left side - Total Score Leaderboard */}
        <div className="lg:col-span-1 transform scale-75">
          <LeaderboardTable 
            title="🏆 Top Players"
            scores={totalScores}
            isLoading={isLoadingTotal}
            maxDisplay={3}
          />
        </div>

        {/* Center - Game Grid */}
        <div className="lg:col-span-1 flex justify-center items-center">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/categories/sentence-scramble"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Sentence Scramble
            </Link>
            <Link
              to="/categories/image-match"
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Image Match
            </Link>
            <Link
              to="/categories/fill-in-the-blank"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Fill in the Blank
            </Link>
            <Link
              to="/game/mixed-rush"
              className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Mixed Rush
            </Link>
          </div>
        </div>

        {/* Right side - Mixed Rush Leaderboard */}
        <div className="lg:col-span-1 transform scale-75">
          <LeaderboardTable 
            title="⚡ Mixed Rush Champions"
            scores={mixedRushScores}
            isLoading={isLoadingMixed}
            maxDisplay={3}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;