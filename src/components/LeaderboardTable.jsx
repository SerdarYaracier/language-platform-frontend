import React, { useState } from 'react';
import ProfileModal from './ProfileModal';

// Madalya ikonlarını oluşturmak için bir yardımcı bileşen
const MedalIcon = ({ rank }) => {
  const medals = {
    0: '🥇', // Gold medal
    1: '🥈', // Silver medal
    2: '🥉', // Bronze medal
  };

  if (rank > 2) return null; // Sadece ilk 3 için madalya göster

  return (
    <div className="text-3xl">
      {medals[rank]}
    </div>
  );
};

// Avatarı veya varsayılan bir ikonu gösteren yardımcı bileşen
const Avatar = ({ url, username }) => {
  if (url) {
    return <img src={url} alt={username} className="w-12 h-12 rounded-full object-cover bg-gray-700" />;
  }
  // Eğer avatar URL'i yoksa, kullanıcının baş harfini göster
  const initial = username ? username.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-12 h-12 rounded-full bg-cyan-700 flex items-center justify-center">
      <span className="text-xl font-bold text-cyan-100">{initial}</span>
    </div>
  );
};


const LeaderboardTable = ({ title, scores, isLoading }) => {
  const topThreeGradients = [
    'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-lg', // Gold
    'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white shadow-md',   // Silver
    'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-sm', // Bronze
  ];

  if (isLoading) {
    return <div className="bg-gray-800 p-6 rounded-lg"><p className="text-center text-gray-400">Loading...</p></div>;
  }

  if (!scores || scores.length === 0) {
    return <div className="bg-gray-800 p-6 rounded-lg"><p className="text-center text-gray-400">No scores recorded yet.</p></div>;
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProfileData, setModalProfileData] = useState(null);

  const openProfile = (entry) => {
    // Create profile data in the format expected by ProfileModal
    const profileData = {
      profile: {
        id: entry.id || entry.user_id || Math.random(), // fallback ID
        username: entry.username || entry.name || 'User',
        avatar_url: entry.avatar_url || entry.avatar,
        mixed_rush_highscore: entry.mixed_rush_highscore || 0,
      },
      game_scores: entry.game_scores || [],
      achievements: entry.achievements || [],
    };
    setModalProfileData(profileData);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalProfileData(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>
      <ol className="space-y-3">
        {scores.map((entry, index) => {
          // Prefer stable keys when available
          const listKey = entry.id || entry.user_id || entry.username || index;
          // Accept multiple possible score field names that backend might return.
          // Fall back to 0 if none are present.
          const rawScore = entry.score ?? entry.total_score ?? entry.total_score_for_game ?? entry.points ?? 0;
          const numericScore = Number(rawScore) || 0;

          return (
          <li 
            key={listKey} 
            onClick={() => openProfile(entry)}
            role="button"
            tabIndex={0}
            className={`cursor-pointer flex items-center justify-between p-4 rounded-lg transition-all transform hover:scale-105 ${
              index < 3 
                ? `${topThreeGradients[index]}` 
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 flex justify-center">
                {index < 3 ? (
                  <MedalIcon rank={index} />
                ) : (
                  <span className="font-bold text-xl text-cyan-400">
                    {index + 1}.
                  </span>
                )}
              </div>
              <Avatar url={entry.avatar_url} username={entry.username} />
              <span className={`font-semibold text-lg ${index < 3 ? 'text-white font-bold' : 'text-gray-300'}`}>
                {entry.username}
              </span>
            </div>
              <span className={`font-bold text-2xl ${index < 3 ? 'text-white drop-shadow-lg' : 'text-cyan-400'}`}>
              {numericScore.toLocaleString()}
            </span>
          </li>
          );
        })}
      </ol>
      <ProfileModal 
        isOpen={modalOpen}
        onClose={closeModal}
        profileData={modalProfileData}
        isLoading={false}
      />
    </div>
  );
};

export default LeaderboardTable;