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

const getGameIcon = (slug) => {
  // daha belirgin emoji ikonlar eklendi
  const icons = {
    'sentence-scramble': '🔤',
    'image-match': '🖼️',
    'fill-in-the-blank': '📝',
  };
  return icons[slug] || '🎮';
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
  const totalCategorizedScore = gameScores.reduce((sum, game) => sum + (game.score || game.total_score_for_game || 0), 0);

  const showLoading = isLoading || isLoadingFull;

  // Fallbacks: sometimes callers pass profileData at top-level (profileData.username)
  const displayUsername = profileDetails.username || dataToUse.username || profileData?.username || '';
  const profileId = profileDetails.id || dataToUse.id || null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-300"
      onClick={handleOverlayClick}
    >
      <div className="profile-modal-root bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-cyan-400/20 animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-300 hover:text-red-200 transition-all duration-200 flex items-center justify-center text-xl z-10"
        >
          ✕
        </button>

        {showLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mb-4"></div>
            <div className="text-xl text-cyan-200">Loading profile...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-xl text-red-300">{error}</div>
          </div>
        ) : !displayUsername ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-4">👤</div>
            <div className="text-xl text-red-300">Profile not found.</div>
          </div>
        ) : (
          <div className="p-8">
            {/* Profile Header */}
            <div className="relative mb-6">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-r from-cyan-400 to-purple-400">
                    <img
                      src={profileDetails.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayUsername}`}
                      alt={displayUsername}
                      className="w-full h-full rounded-full bg-slate-800 object-cover"
                    />
                  </div>
                  {/* removed small 'You' badge */}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent mb-2">
                    {profileDetails.username}
                  </h1>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-4">
                    <div className="bg-cyan-900/30 px-4 py-2 rounded-lg border border-cyan-400/20">
                      <span className="text-cyan-200 text-sm">Total Score</span>
                      <div className="text-2xl font-bold text-white">
                        {(totalCategorizedScore + (profileDetails.mixed_rush_highscore || 0)).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-400/20">
                      <span className="text-purple-200 text-sm">Rush Highscore</span>
                      <div className="text-2xl font-bold text-white">
                        {(profileDetails.mixed_rush_highscore || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* NEW: horizontal game scores container under the header */}
                  <div className="mt-4">
                    {/* stacked container: üç oyunun metinleri alt alta birleşik şekilde, yatay scroll yok */}
                    <div className="py-2">
                      <div className="flex flex-col gap-3">
                        {gameScores.length > 0 ? (
                          gameScores.map((g) => (
                            <div
                              key={g.game_type_slug}
                              className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-600/30 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-700/20 rounded-lg flex items-center justify-center text-2xl">
                                  {getGameIcon(g.game_type_slug)}
                                </div>
                                <div>
                                  <div className="text-sm text-cyan-100 font-medium">{getGameName(g.game_type_slug)}</div>
                                  <div className="text-xs text-slate-300">{g.description || ''}</div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-white text-lg font-bold">{(g.score || g.total_score_for_game || 0).toLocaleString()}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="w-full bg-slate-800/40 rounded-xl p-6 border border-slate-600/20 text-center text-cyan-200">
                            <div className="text-2xl mb-1">🎯</div>
                            <div className="text-sm">No game scores yet</div>
                            <div className="text-xs text-slate-400">Play games to populate this list</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements - expanded to be main content */}
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 backdrop-blur-sm p-6 rounded-2xl border border-purple-400/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <span className="text-xl">🏆</span>
                </div>
                <h2 className="text-2xl font-bold text-purple-100">Achievements</h2>
                <span className="bg-purple-500/20 text-purple-200 text-sm px-2 py-1 rounded-full ml-auto">
                  {achievements.length}
                </span>
              </div>

              {achievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {achievements.map((ach, index) => (
                    <div
                      key={index}
                      className="group relative flex flex-col items-center p-3 bg-slate-800/50 rounded-xl border border-slate-600/30 hover:border-purple-400/30 transition-all duration-200 hover:scale-105"
                      title={`${ach.name?.en || ''} - ${ach.description?.en || ''}`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-purple-400/30">
                        <img
                          src={ach.icon_url}
                          alt={ach.name?.en}
                          className="w-full h-full object-cover bg-slate-700"
                        />
                      </div>
                      <p className="text-sm text-purple-200 text-center font-medium leading-tight">
                        {ach.name?.en}
                      </p>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-slate-600">
                        {ach.description?.en}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎖️</div>
                  <p className="text-purple-200/70">No achievements earned yet.</p>
                  <p className="text-purple-300/50 text-sm mt-2">Complete games to unlock achievements!</p>
                </div>
              )}
            </div>

            {/* Stats Footer */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600/30">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm text-slate-300">Total Games</div>
                <div className="text-lg font-bold text-white">{gameScores.length}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600/30">
                <div className="text-2xl mb-1">🏅</div>
                <div className="text-sm text-slate-300">Achieve<br />ments</div>
                <div className="text-lg font-bold text-white">{achievements.length}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600/30">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-sm text-slate-300">Rush Score</div>
                <div className="text-lg font-bold text-white">{(profileDetails.mixed_rush_highscore || 0).toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600/30">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-sm text-slate-300">Avg Score</div>
                <div className="text-lg font-bold text-white">
                  {gameScores.length > 0 ? Math.round(totalCategorizedScore / gameScores.length).toLocaleString() : '0'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;