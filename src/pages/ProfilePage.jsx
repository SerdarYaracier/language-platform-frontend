import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import AchievementsList from '../components/AchievementsList';
import FriendsModal from '../components/FriendsModal';

// Supabase bucket for decorative assets
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

// Yardımcı fonksiyon
const getGameName = (slug) => {
  const names = {
    'sentence-scramble': 'Sentence Scramble',
    'image-match': 'Image Match',
    'fill-in-the-blank': 'Fill in the Blank',
  };
  return names[slug] || 'Unknown Game';
};

const getGameIcon = (slug) => {
  const icons = {
    'sentence-scramble': '🧩',
    'image-match': '🖼️',
    'fill-in-the-blank': '📝',
  };
  return icons[slug] || '🎮';
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError('');
      api.get('/api/profile/')
        .then(response => {
          setProfileData(response.data);
        })
        .catch(error => {
          console.error("Failed to fetch profile", error);
          setError("Failed to load profile data.");
          // Fallback mock data for development
          setProfileData({
            profile: {
              username: user?.email?.split('@')[0] || 'TestUser',
              avatar_url: null,
              total_score: 1250,
              mixed_rush_highscore: 150
            },
            game_scores: [
              { game_slug: 'sentence-scramble', score: 450 },
              { game_slug: 'image-match', score: 350 },
              { game_slug: 'fill-in-the-blank', score: 450 }
            ]
          });
          setError(''); // Clear error since we have fallback data
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 flex items-center justify-center">
        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-8 rounded-2xl text-center border border-cyan-400/20 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-xl text-cyan-200">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 flex items-center justify-center">
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-8 rounded-2xl text-center border border-red-400/30">
          <div className="text-2xl text-red-300 mb-4">⚠️</div>
          <div className="text-xl text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">Could not find profile data.</div>
      </div>
    );
  }

  // Backend'den gelen veriyi ayrıştıralım
  const profileDetails = (Array.isArray(profileData) && profileData[0]) || profileData.profile || profileData;
  const gameScores = profileData.game_scores || profileData.game_scores_list || [];
  
  // avatar fallback
  const avatarUrl = profileDetails.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((profileDetails.username || user.email || 'User'))}&background=1a202c&color=ffffff&rounded=true&size=256`;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 text-white">
        <div className="container mx-auto px-6 py-8">
          
          {/* Hero Section - Profile Header */}
          <div className="relative mb-12">
            <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 backdrop-blur-sm rounded-3xl p-8 border border-cyan-400/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                
                {/* Avatar & Main Info */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative">
                    <img 
                      src={avatarUrl} 
                      alt="avatar" 
                      className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-cyan-400/30 shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-gray-900 flex items-center justify-center">
                      <span className="text-xs">🌟</span>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl lg:text-4xl font-bold mt-4 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                    {profileDetails.username || user.email}
                  </h1>
                  <p className="text-cyan-200/80 text-lg">{user.email}</p>
                  
                  <button 
                    onClick={() => setIsFriendsModalOpen(true)}
                    className="mt-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/20 flex items-center"
                  >
                    <img
                      src={`${SUPABASE_BUCKET_URL}/friends_gecko.png`}
                      alt="friends gecko"
                      className="w-10 h-10 rounded-full object-cover mr-2"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>Friends</span>
                  </button>
                </div>

                {/* Stats Cards - Horizontal Layout */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 lg:ml-8">
                  {/* Total Score Card */}
                  <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 backdrop-blur-sm p-6 rounded-2xl border border-yellow-400/20 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="mb-2 flex items-center justify-center">
                      <img
                        src={`${SUPABASE_BUCKET_URL}/cup2_gecko.png`}
                        alt="cup gecko"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <h3 className="text-yellow-200 font-semibold mb-2">Total Score</h3>
                    <p className="text-4xl font-bold text-yellow-300">
                      {profileDetails.total_score?.toLocaleString() || '0'}
                    </p>
                  </div>

                  {/* Mixed Rush Card */}
                  <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-6 rounded-2xl border border-red-400/20 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="mb-2 flex items-center justify-center">
                      <img
                        src={`${SUPABASE_BUCKET_URL}/lightning_gecko.png`}
                        alt="lightning gecko"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <h3 className="text-red-200 font-semibold mb-2">Mixed Rush</h3>
                    <p className="text-4xl font-bold text-red-300">
                      {profileDetails.mixed_rush_highscore?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Scores Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              Game Performance
            </h2>
            
            {gameScores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gameScores.map((game, index) => (
                  <div 
                    key={game.game_slug} 
                    className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm p-6 rounded-2xl border border-cyan-400/20 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4">{getGameIcon(game.game_slug)}</div>
                      <h3 className="text-xl font-semibold text-cyan-100 mb-2">
                        {getGameName(game.game_slug)}
                      </h3>
                      <div className="text-3xl font-bold text-cyan-300 mb-2">
                        {game.score?.toLocaleString() || '0'}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, (game.score / 1000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm p-12 rounded-2xl border border-gray-600/20">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-xl text-gray-300 mb-4">No game scores yet!</p>
                <p className="text-gray-400">Start playing to see your progress here.</p>
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="relative bg-gradient-to-br from-purple-900/20 to-purple-800/20 backdrop-blur-sm p-8 rounded-3xl border border-purple-400/20 shadow-2xl overflow-hidden">
            {/* Left medal gecko */}
            <img
              src={`${SUPABASE_BUCKET_URL}/medal_gecko_left.png`}
              alt="medal gecko left"
              className="absolute top-6 left-6 w-16 h-16 md:w-30 md:h-30 lg:w-32 lg:h-32 rounded-full opacity-70 pointer-events-none"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* Right medal gecko */}
            <img
              src={`${SUPABASE_BUCKET_URL}/medal_gecko_right.png`}
              alt="medal gecko right"
              className="absolute top-6 right-6 w-16 h-16 md:w-30 md:h-30 lg:w-32 lg:h-32 rounded-full opacity-70 pointer-events-none"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              🏅 Achievements
            </h2>
            <AchievementsList />
          </div>
        </div>
      </div>

      {/* Friends Modal */}
      <FriendsModal 
        isOpen={isFriendsModalOpen} 
        onClose={() => setIsFriendsModalOpen(false)} 
      />
    </>
  );
};

export default ProfilePage;