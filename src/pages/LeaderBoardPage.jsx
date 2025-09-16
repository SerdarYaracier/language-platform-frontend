import React, { useState, useEffect } from 'react';
import api from '../api';
import LeaderboardTable from '../components/LeaderboardTable';

// Supabase bucket for decorative assets
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

const LeaderboardPage = () => {
  const [leaderboards, setLeaderboards] = useState({
    total_score: [],
    mixed_rush: [],
    image_match: [],
    sentence_scramble: [],
    fill_in_the_blank: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('total_score');

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true);
      try {
        const [totalRes, rushRes, imageRes, scrambleRes, blankRes] = await Promise.all([
          api.get('/api/leaderboard/total-score'),
          api.get('/api/leaderboard/mixed-rush'),
          api.get('/api/leaderboard/game/image-match'),
          api.get('/api/leaderboard/game/sentence-scramble'),
          api.get('/api/leaderboard/game/fill-in-the-blank'),
        ]);
        setLeaderboards({
          total_score: totalRes.data,
          mixed_rush: rushRes.data,
          image_match: imageRes.data,
          sentence_scramble: scrambleRes.data,
          fill_in_the_blank: blankRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch leaderboards", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboards();
  }, []);

  const tabs = [
    {
      id: 'total_score',
      title: 'Overall Champions',
      icon: (
        <img
          src={`${SUPABASE_BUCKET_URL}/cup_gecko.png`}
          alt="cup gecko"
          className="w-8 h-8 object-contain rounded-full"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ),
      color: 'from-yellow-600 to-yellow-700'
    },
    {
      id: 'mixed_rush',
      title: 'Speed Masters',
      icon: (
        <img
          src={`${SUPABASE_BUCKET_URL}/lightning_gecko.png`}
          alt="lightning gecko"
          className="w-8 h-8 object-contain rounded-full"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ),
      color: 'from-red-600 to-red-700'
    },
    {
      id: 'image_match',
      title: 'Visual Experts',
      icon: (
        <img
          src={`${SUPABASE_BUCKET_URL}/image-match-gecko.png`}
          alt="image match gecko"
          className="w-8 h-8 object-contain rounded-full"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ),
      color: 'from-purple-600 to-purple-700'
    },
    {
      id: 'sentence_scramble',
      title: 'Word Wizards',
      icon: (
        <img
          src={`${SUPABASE_BUCKET_URL}/scramble_gecko.png`}
          alt="scramble gecko"
          className="w-8 h-8 object-contain rounded-full"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ),
      color: 'from-cyan-600 to-cyan-700'
    },
    {
      id: 'fill_in_the_blank',
      title: 'Grammar Gurus',
      icon: (
        <img
          src={`${SUPABASE_BUCKET_URL}/fiib_gecko.png`}
          alt="fiib gecko"
          className="w-8 h-8 object-contain rounded-full"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ),
      color: 'from-green-600 to-green-700'
    },
  ];

  const getTabButtonClass = (tabId) => {
    const baseClass = 'flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105';
    if (activeTab === tabId) {
      const activeTab = tabs.find(t => t.id === tabId);
      return `${baseClass} bg-gradient-to-r ${activeTab.color} text-white shadow-lg border border-white/20`;
    }
    return `${baseClass} bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/30`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/15 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 animate-in fade-in-50 duration-700">
            <span className="inline-flex items-center gap-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
              <img
                src={`${SUPABASE_BUCKET_URL}/cup2_gecko.png`}
                alt="cup gecko"
                className="w-14 h-14 object-contain rounded-full"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span>Hall of Fame</span>
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-6 animate-in slide-in-from-bottom-2 duration-500">
            Celebrate the top performers across all language learning games
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-in fade-in-50 duration-500">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={getTabButtonClass(tab.id)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline text-sm font-semibold">{tab.title}</span>
              <span className="sm:hidden text-sm font-semibold">
                {tab.title.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Active Leaderboard */}
        <div className="flex justify-center animate-in fade-in-50 slide-in-from-bottom-3 duration-700">
          <div className="w-full max-w-2xl">
            {/* Enhanced title for active tab */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-3 rounded-2xl border border-gray-600/30 backdrop-blur-sm">
                <span className="text-3xl">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </span>
                <h2 className="text-2xl font-bold text-white">
                  {tabs.find(t => t.id === activeTab)?.title}
                </h2>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="transform hover:scale-[1.02] transition-transform duration-300">
              <LeaderboardTable 
                title=""
                scores={leaderboards[activeTab]} 
                isLoading={isLoading}
                maxDisplay={10}
              />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in-50 duration-700">
          {tabs.map((tab, index) => (
            <div 
              key={tab.id}
              className="bg-gradient-to-br from-gray-800/40 to-gray-700/40 backdrop-blur-sm p-4 rounded-xl border border-gray-600/20 text-center hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => setActiveTab(tab.id)}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="text-2xl mb-2">{tab.icon}</div>
              <div className="text-sm text-gray-300 mb-1">{tab.title}</div>
              <div className="text-lg font-bold text-white">
                {isLoading ? '...' : leaderboards[tab.id]?.length || 0}
              </div>
              <div className="text-xs text-gray-400">players</div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center mt-12 text-gray-400 text-sm animate-in fade-in-50 duration-700">
          <p>Leaderboards are updated in real-time. Keep playing to climb the ranks!</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Live Rankings
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Updated Daily
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;