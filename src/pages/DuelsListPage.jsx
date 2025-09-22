import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner'; // Loading spinner bileşenini kullanıyoruz

const DuelsListPage = ({ embedded = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming', 'sent', 'completed'
  const [duelsData, setDuelsData] = useState({
    pending_challenges_for_me: [],
    my_sent_challenges: [],
    completed_duels: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarMap, setAvatarMap] = useState({});

  const fetchDuels = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setError("User not authenticated.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/duel/my-duels');
      setDuelsData(response.data);
      console.log('[DuelsListPage] fetched duels:', response.data);

      // after fetching duels, find any opponent ids missing avatar_url and fetch their full profile
      try {
        const allDuels = response.data.pending_challenges_for_me.concat(response.data.my_sent_challenges, response.data.completed_duels);
        const missingIds = new Set();
        allDuels.forEach(duel => {
          const opponent = (duel.challenger_id === user.id) ? duel.challenged : duel.challenger;
          const opponentId = (duel.challenger_id === user.id) ? duel.challenged_id : duel.challenger_id;
          const avatar = opponent?.avatar_url || opponent?.profile?.avatar_url || opponent?.profile_image || null;
          // only add to missingIds if we haven't attempted to resolve this id before
          if (!avatar && opponentId && !(opponentId in avatarMap)) missingIds.add(opponentId);
        });

        if (missingIds.size > 0) {
          console.log('[DuelsListPage] need to fetch avatars for ids:', Array.from(missingIds));
          const promises = Array.from(missingIds).map(id =>
            api.get(`/api/profile/${encodeURIComponent(id)}`)
              .then(res => ({ id, data: res.data }))
              .catch(err => ({ id, err }))
          );
          const results = await Promise.all(promises);
          const updates = {};
          results.forEach(r => {
            if (r.err) {
              // log axios error details when available
              const err = r.err;
              console.warn('[DuelsListPage] failed to fetch profile for id', r.id, err.message || err);
              if (err.response) {
                console.warn('[DuelsListPage] profile fetch error response status:', err.response.status);
                console.warn('[DuelsListPage] profile fetch error response data:', err.response.data);
              } else if (err.request) {
                console.warn('[DuelsListPage] profile fetch made request but no response received for id', r.id);
              }
              // mark this id as attempted (no avatar) so we don't keep refetching and spamming 500s
              updates[r.id] = null;
              return;
            }
            const d = r.data;
            console.log('[DuelsListPage] profile response for', r.id, d);
            // possible shapes: { profile: { avatar_url: ... } } or { avatar_url: '...' } or array
            let fetchedAvatar = null;
            if (!d) fetchedAvatar = null;
            else if (Array.isArray(d)) {
              const first = d[0] || {};
              fetchedAvatar = first.profile?.avatar_url || first.avatar_url || first.profile_image || null;
            } else if (d.profile) {
              fetchedAvatar = d.profile.avatar_url || d.avatar_url || d.profile_image || null;
            } else {
              fetchedAvatar = d.avatar_url || d.profile?.avatar_url || d.profile_image || null;
            }
            if (fetchedAvatar) {
              let finalUrl = fetchedAvatar;
              if (!/^https?:\/\//i.test(finalUrl)) {
                const cleaned = finalUrl.replace(/^\/+/, '');
                if (cleaned.includes('storage') || cleaned.includes('stuffs/') || cleaned.includes('avatars') || !cleaned.includes('/')) {
                  finalUrl = `https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs/${cleaned}`;
                } else {
                  finalUrl = `https://${cleaned}`;
                }
              }
              updates[r.id] = finalUrl;
              console.log('[DuelsListPage] fetched avatar for', r.id, finalUrl);
            } else {
              console.log('[DuelsListPage] no avatar found in profile response for', r.id);
              // mark as attempted so we don't re-request repeatedly
              updates[r.id] = null;
            }
          });
          if (Object.keys(updates).length > 0) setAvatarMap(prev => ({ ...prev, ...updates }));
        }
      } catch (err) {
        console.warn('[DuelsListPage] error while fetching missing avatars', err);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch duels.');
      console.error("Duels fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, avatarMap]);

  useEffect(() => {
    fetchDuels();
  }, [fetchDuels]);

  const handlePlayDuel = (duelId) => {
    navigate(`/duel/${duelId}`); // Challenged oyuncu için oynama sayfasına yönlendir
  };

  const getOpponentInfo = (duel) => {
    // Backend'den gelen 'challenger' ve 'challenged' objeleri 'username' içeriyor olmalı
    if (duel.challenger_id === user.id) {
      const info = {
        id: duel.challenged_id,
        username: duel.challenged?.username || 'Opponent',
        avatar_url: duel.challenged?.avatar_url || duel.challenged?.profile?.avatar_url || duel.challenged?.profile_image || null,
        type: 'challenged'
      };
      // if we have an override from avatarMap, use it
      if (avatarMap[info.id]) info.avatar_url = avatarMap[info.id];
      console.log('[DuelsListPage] opponent resolved (challenged):', info);
      return info;
    } else {
      const info = {
        id: duel.challenger_id,
        username: duel.challenger?.username || 'Challenger',
        avatar_url: duel.challenger?.avatar_url || duel.challenger?.profile?.avatar_url || duel.challenger?.profile_image || null,
        type: 'challenger'
      };
      if (avatarMap[info.id]) info.avatar_url = avatarMap[info.id];
      console.log('[DuelsListPage] opponent resolved (challenger):', info);
      return info;
    }
  };

  if (isLoading) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
          <span className="ml-3 text-gray-300">Loading duels...</span>
        </div>
      );
    }
    return <LoadingSpinner />;
  }

  if (error) {
    if (embedded) {
      return <div className="text-red-500 text-center py-4">{error}</div>;
    }
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8"}>
      <div className={`${embedded ? "bg-transparent" : "max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl"} ${embedded ? "p-0" : "p-6 sm:p-8"}`}>
        {!embedded && <h1 className="text-4xl font-bold mb-8 text-center text-red-400">My Duels</h1>}

        {/* Tab Navigasyonu */}
        <div className="flex justify-center border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 
                        ${activeTab === 'incoming' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
          >
            Incoming Challenges ({duelsData.pending_challenges_for_me.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 
                        ${activeTab === 'sent' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
          >
            My Sent Challenges ({duelsData.my_sent_challenges.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 
                        ${activeTab === 'completed' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
          >
            Completed Duels ({duelsData.completed_duels.length})
          </button>
        </div>

        {/* İçerik Alanı */}
        <div className="space-y-4">
          {activeTab === 'incoming' && (
            <div>
              {duelsData.pending_challenges_for_me.length > 0 ? (
                duelsData.pending_challenges_for_me.map(duel => {
                  const opponent = getOpponentInfo(duel);
                  return (
                    <div key={duel.id} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between mb-3 shadow-md">
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        {opponent.avatar_url ? (
                          <img
                            src={opponent.avatar_url}
                            alt={opponent.username}
                            className="w-12 h-12 rounded-full object-cover border border-gray-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 border border-gray-500" />
                        )}
                        <div>
                          <p className="text-lg font-bold text-white">{opponent.username} challenged you!</p>
                          <p className="text-sm text-gray-300">Difficulty: {duel.difficulty_level === 0 ? 'ALL' : `Level ${duel.difficulty_level}`}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <span className="text-yellow-400 text-sm">Opponent Score: {duel.challenger_score}</span>
                        <button
                          onClick={() => handlePlayDuel(duel.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          Play Now
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center text-lg py-8">No incoming challenges.</p>
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div>
              {duelsData.my_sent_challenges.length > 0 ? (
                duelsData.my_sent_challenges.map(duel => {
                  const opponent = getOpponentInfo(duel);
                  return (
                    <div key={duel.id} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between mb-3 shadow-md">
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        {opponent.avatar_url ? (
                          <img
                            src={opponent.avatar_url}
                            alt={opponent.username}
                            className="w-12 h-12 rounded-full object-cover border border-gray-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 border border-gray-500" />
                        )}
                        <div>
                          <p className="text-lg font-bold text-white">You challenged {opponent.username}</p>
                          <p className="text-sm text-gray-300">Difficulty: {duel.difficulty_level === 0 ? 'ALL' : `Level ${duel.difficulty_level}`}</p>
                          <p className="text-sm text-gray-400">Your Score: {duel.challenger_score}</p>
                        </div>
                      </div>
                      <span className="text-yellow-400 text-sm">Waiting for opponent to play...</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center text-lg py-8">No challenges sent by you.</p>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              {duelsData.completed_duels.length > 0 ? (
                duelsData.completed_duels.map(duel => {
                  const opponent = getOpponentInfo(duel);
                  const isWinner = duel.winner_id === user.id;
                  const yourScore = duel.challenger_id === user.id ? duel.challenger_score : duel.challenged_score;
                  const opponentScore = duel.challenger_id === user.id ? duel.challenged_score : duel.challenger_score;

                  return (
                    <div key={duel.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between mb-3 shadow-md 
                                                    ${isWinner ? 'bg-green-700/30 border border-green-500' : 'bg-red-700/30 border border-red-500'}`}>
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        {opponent.avatar_url ? (
                          <img
                            src={opponent.avatar_url}
                            alt={opponent.username}
                            className="w-12 h-12 rounded-full object-cover border border-gray-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 border border-gray-500" />
                        )}
                        <div>
                          <p className="text-lg font-bold text-white">Duel vs. {opponent.username}</p>
                          <p className="text-sm text-gray-300">Difficulty: {duel.difficulty_level === 0 ? 'ALL' : `Level ${duel.difficulty_level}`}</p>
                          <p className={`text-sm font-semibold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                            {isWinner ? 'WIN' : 'LOSS'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <span className="text-white text-sm">Your Score: {yourScore}</span>
                        <span className="text-white text-sm">Opponent Score: {opponentScore}</span>
                        {/* Duel detayları için bir buton eklenebilir */}
                        {/* <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">View Details</button> */}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center text-lg py-8">No completed duels.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuelsListPage;