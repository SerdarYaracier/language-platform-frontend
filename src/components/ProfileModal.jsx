import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './ProfileModal.css';

const getGameName = (slug) => {
  const names = {
    'sentence-scramble': 'Sentence Scramble',
    'image-match': 'Image Match', 
    'fill-in-the-blank': 'Fill in the Blank',
  };
  return names[slug] || 'Unknown Game';
};

const ProfileModal = ({ isOpen, onClose, profileData, isLoading }) => {
  const { user } = useAuth();
  const [fullProfileData, setFullProfileData] = useState(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [error, setError] = useState('');

  // Extract username from initial profileData
  const username = profileData?.profile?.username || profileData?.username;

  useEffect(() => {
    if (isOpen && username && !fullProfileData) {
      setIsLoadingFull(true);
      setError('');
      
      api.get(`/api/profile/${encodeURIComponent(username)}`)
        .then(response => {
          console.debug('Full profile fetched:', response.data);
          setFullProfileData(response.data);
        })
        .catch(err => {
          console.error('Failed to fetch full profile:', err);
          setError('Failed to load full profile data');
          // Fallback to initial data if fetch fails
          setFullProfileData(profileData);
        })
        .finally(() => {
          setIsLoadingFull(false);
        });
    }
  }, [isOpen, username, fullProfileData, profileData]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFullProfileData(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use full profile data if available, otherwise fallback to initial data
  const dataToUse = fullProfileData || profileData || {};
  const profileDetails = dataToUse.profile || {};
  const gameScores = dataToUse.game_scores || [];
  const achievements = dataToUse.achievements || [];
  const totalCategorizedScore = gameScores.reduce((sum, game) => sum + (game.score || 0), 0);
  
  const showLoading = isLoading || isLoadingFull;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
        {showLoading ? (
          <div className="p-10 text-center">Loading profile...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : !profileDetails.username ? (
            <div className="p-10 text-center text-red-400">Profile not found.</div>
        ) : (
          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <img src={profileDetails.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profileDetails.username}`} alt={profileDetails.username} className="w-24 h-24 rounded-full mb-4 border-4 border-cyan-500" />
              <h1 className="text-3xl font-bold text-cyan-400">{profileDetails.username}</h1>
              {user?.id === profileDetails.id && <span className="text-xs bg-cyan-800 text-cyan-200 px-2 py-1 rounded-full mt-2">This is you</span>}
            </div>

            {/* Skorlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-900 p-4 rounded-md text-center">
                <h3 className="font-bold text-lg mb-2">Total & Rush Score</h3>
                <p className="text-3xl font-bold text-yellow-400">{(totalCategorizedScore + (profileDetails.mixed_rush_highscore || 0)).toLocaleString()}</p>
                <p className="text-sm text-gray-400">Mixed Rush Highscore: {profileDetails.mixed_rush_highscore || 0}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-md">
                <h3 className="font-bold text-lg mb-2 text-center">Game Scores</h3>
                {gameScores.length > 0 ? (
                  gameScores.map(game => (
                    <div key={game.game_slug} className="flex justify-between text-sm mb-1">
                      <span>{getGameName(game.game_slug)}</span>
                      <span className="font-semibold">{(game.score || 0).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No game scores recorded yet.</p>
                )}
              </div>
            </div>

            {/* Madalyalar */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center">Achievements</h2>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {achievements.map((ach, index) => (
                     <div key={index} className="flex flex-col items-center text-center" title={`${ach.name.en} - ${ach.description.en}`}>
                       <img src={ach.icon_url} alt={ach.name.en} className="w-16 h-16 mb-2 rounded-full bg-gray-700" />
                       <p className="text-xs text-gray-300">{ach.name.en}</p>
                     </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No achievements earned yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;