import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import ProfileModal from './ProfileModal';

// Arama sonuçlarındaki her bir kullanıcı için küçük bir kart
const UserSearchResultCard = ({ user, onAddFriend }) => (
  <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-3">
      <img 
        src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} 
        alt={user.username} 
        className="w-10 h-10 rounded-full bg-gray-600"
      />
      <span className="font-bold">{user.username}</span>
    </div>
    {/* Not: Profile görme butonu şimdilik eklenmedi, sadeliği korumak için. */}
    <button onClick={() => onAddFriend(user.username)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm py-1 px-3 rounded">
      Add Friend
    </button>
  </div>
);

const FriendsModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendsData, setFriendsData] = useState({ friends: [], incoming_requests: [] });
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [showRequestsPopup, setShowRequestsPopup] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  

  // Arkadaşları ve istekleri getiren fonksiyon
  const fetchFriendsData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/social/friends');
      setFriendsData(data);
    } catch (error) {
      console.error("Failed to fetch friends data", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFriendsData();
    }
  }, [isOpen, fetchFriendsData]);

  // Arama sorgusu değiştiğinde kullanıcıları arayan useEffect
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        setFeedback({ message: '', type: '' });
        try {
          const encoded = encodeURIComponent(searchQuery);
          const response = await api.get(`/api/social/users/search?query=${encoded}`);
          setSearchResults(response.data || []);
        } catch (err) {
          console.warn('Search failed', err && err.message ? err.message : err);
          setSearchResults([]);
          setFeedback({ message: 'Search failed. Please try again later.', type: 'error' });
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setFeedback({ message: '', type: '' });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleAddFriend = async (username) => {
    try {
        const response = await api.post('/api/social/friends/add', { username });
        setFeedback({ message: response.data.message, type: 'success' });
        // İsteği gönderdikten sonra arama sonuçlarından o kullanıcıyı kaldır
        setSearchResults(prev => prev.filter(user => user.username !== username));
        await fetchFriendsData();
    } catch (error) {
        setFeedback({ message: error.response?.data?.error || 'An error occurred.', type: 'error' });
    }
  };

  const handleAcceptRequest = async (request) => {
    const friendshipId = request?.friendship_id || request?.id;
    if (!friendshipId) {
      setFeedback({ message: 'Missing friendship id for accept.', type: 'error' });
      return;
    }
    try {
      const response = await api.post('/api/social/friends/accept', { friendship_id: friendshipId });
      setFeedback({ message: response.data.message || 'Friend request accepted!', type: 'success' });
      await fetchFriendsData(); // Refresh friends data
    } catch (error) {
      setFeedback({ message: error.response?.data?.error || 'Failed to accept request.', type: 'error' });
    }
  };
 
  const handleDeclineRequest = async (request) => {
    const friendshipId = request?.friendship_id || request?.id;
    if (!friendshipId) {
      setFeedback({ message: 'Missing friendship id for decline.', type: 'error' });
      return;
    }
    try {
      const response = await api.post('/api/social/friends/reject', { friendship_id: friendshipId });
      setFeedback({ message: response.data.message || 'Friend request declined.', type: 'success' });
      await fetchFriendsData(); // Refresh friends data
    } catch (error) {
      setFeedback({ message: error.response?.data?.error || 'Failed to decline request.', type: 'error' });
    }
  };

  const handleFriendClick = (friend) => {
    // Arkadaşın profil verisini hazırla
    const profileData = {
      profile: {
        id: friend.id,
        username: friend.username,
        avatar_url: friend.avatar_url
      },
      game_scores: [],
      achievements: []
    };
    setSelectedFriend(profileData);
    setShowFriendProfile(true);
  };

  const closeFriendProfile = () => {
    setShowFriendProfile(false);
    setSelectedFriend(null);
  };
 
  if (!isOpen) return null;

  const incomingRequestCount = friendsData.incoming_requests.length;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-center">Friends</h2>
            {/* Search Bar */}
            <div className="mt-4">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users to add..."
                className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            {/* Arama Sonuçları */}
            {isSearching && <p className="text-center text-gray-400">Searching...</p>}
            {feedback.message && <p className={`text-center text-sm mb-2 ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.message}</p>}
            {searchResults.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold">Search Results:</h3>
                {searchResults.map(user => (
                  <UserSearchResultCard key={user.id} user={user} onAddFriend={handleAddFriend} />
                ))}
              </div>
            )}
            
            {/* Arkadaşlar Konteyneri */}
            <div className="mt-4">
              <button 
                onClick={() => setShowRequestsPopup(true)}
                className={`w-full text-left font-bold py-2 px-4 rounded mb-2 ${incomingRequestCount > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
              >
                Friend Requests ({incomingRequestCount})
              </button>

              {/* Friend Requests Popup */}
              {showRequestsPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60" onClick={() => setShowRequestsPopup(false)}>
                  <div className="bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Friend Requests</h3>
                      <button 
                        onClick={() => setShowRequestsPopup(false)}
                        className="text-gray-400 hover:text-white text-xl"
                      >
                        ×
                      </button>
                    </div>
                    
                    {friendsData.incoming_requests.length > 0 ? (
                      <div className="space-y-3">
                        {friendsData.incoming_requests.map(request => (
                          <div key={request.id || request.username} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src={request.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${request.username}`} 
                                alt={request.username}
                                className="w-10 h-10 rounded-full bg-gray-600"
                              />
                              <span className="font-bold">{request.username}</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleAcceptRequest(request)}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded transition-colors"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleDeclineRequest(request)}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No pending friend requests.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Mevcut Arkadaş Listesi (tıklanabilir) */}
              <h3 className="font-semibold mt-4">Your Friends:</h3>
              {friendsData.friends.length > 0 ? (
                  <div className="space-y-2 mt-2">
                      {friendsData.friends.map(friend => (
                          <div 
                            key={friend.id || friend.username} 
                            onClick={() => handleFriendClick(friend)}
                            className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleFriendClick(friend);
                              }
                            }}
                          >
                              <img 
                                src={friend.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.username}`} 
                                alt={friend.username} 
                                className="w-10 h-10 rounded-full bg-gray-600"
                              />
                              <span className="font-bold">{friend.username}</span>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-gray-500 text-center mt-2">You haven't added any friends yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Friend Profile Modal */}
      {showFriendProfile && selectedFriend && (
        <ProfileModal 
          isOpen={showFriendProfile}
          onClose={closeFriendProfile}
          profileData={selectedFriend}
          isLoading={false}
        />
      )}
    </>
  );
};

export default FriendsModal;