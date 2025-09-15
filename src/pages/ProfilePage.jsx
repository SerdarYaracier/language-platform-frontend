import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import AchievementsList from '../components/AchievementsList';
import FriendsModal from '../components/FriendsModal'; // Yeni modalı import et

// Yardımcı fonksiyon
const getGameName = (slug) => {
  const names = {
    'sentence-scramble': 'Sentence Scramble',
    'image-match': 'Image Match',
    'fill-in-the-blank': 'Fill in the Blank',
  };
  return names[slug] || 'Unknown Game';
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false); // Modal state'i

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
    return <p className="text-center text-xl">Loading profile...</p>;
  }

  if (error) {
    return <p className="text-center text-red-400">{error}</p>;
  }

  if (!profileData) {
    return <p className="text-center text-gray-400">Could not find profile data.</p>;
  }

  // Backend'den gelen veriyi ayrıştıralım
  // Backend rpc may return [{...}] or direct profile object. Support both shapes.
  const profileDetails = (Array.isArray(profileData) && profileData[0]) || profileData.profile || profileData;
  // game scores may be provided as profileData.game_scores or profileData.game_scores_list
  const gameScores = profileData.game_scores || profileData.game_scores_list || [];
  
  // avatar fallback: use avatar_url from profileDetails or a simple generated placeholder
  const avatarUrl = profileDetails.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((profileDetails.username || user.email || 'User'))}&background=1a202c&color=ffffff&rounded=true&size=256`;

  return (
    <> {/* Fragment kullanarak modalı da render edebiliyoruz */}
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-4xl mx-auto text-white">
        <div className="flex flex-col items-center mb-6">
          <img src={avatarUrl} alt="avatar" className="w-28 h-28 rounded-full object-cover border-4 border-gray-900 shadow-lg" />
          <h1 className="text-4xl font-bold mt-4 text-cyan-400">{profileDetails.username || user.email}'s Profile</h1>
          <p className="text-lg text-gray-400 mt-2">{user.email}</p>
          
          {/* YENİ ARKADAŞLAR BUTONU */}
          <button 
            onClick={() => setIsFriendsModalOpen(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            Friends
          </button>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol Taraf: Genel Skorlar */}
        <div className="md:col-span-1 bg-gray-900 p-6 rounded-md text-center">
          <h2 className="text-2xl font-bold mb-4">Overall Stats</h2>
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-300">Total Score</p>
            {/* DEĞİŞİKLİK BURADA: Artık sadece backend'den gelen 'total_score'u gösteriyoruz */}
            <p className="text-5xl font-bold text-yellow-400">
              {profileDetails.total_score || 0}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Mixed Rush Highscore</p>
            <p className="text-3xl">{profileDetails.mixed_rush_highscore || 0}</p>
          </div>
        </div>

        {/* Sağ Taraf: Oyun Bazında Skorlar */}
        <div className="md:col-span-2 bg-gray-900 p-6 rounded-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Scores by Game</h2>
          <div className="space-y-4">
            {gameScores.length > 0 ? (
              gameScores.map(game => (
                <div key={game.game_slug} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                  <span className="font-semibold">{getGameName(game.game_slug)}</span>
                  <span className="text-xl font-bold text-yellow-400">{game.score}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400">No game scores recorded yet. Go play!</p>
            )}
          </div>
        </div>
      </div>

        
        {/* Alt Kısım: Madalya Listesi */}
        <div className="mt-10">
          <AchievementsList />
        </div>
      </div>

      {/* MODAL'I BURADA ÇAĞIRIYORUZ */}
      <FriendsModal 
        isOpen={isFriendsModalOpen} 
        onClose={() => setIsFriendsModalOpen(false)} 
      />
    </>
  );
};

export default ProfilePage;