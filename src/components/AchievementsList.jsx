import React, { useState, useEffect } from 'react';
import api from '../api';

const AchievementsList = () => {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/api/achievements/')
      .then(response => {
        setAchievements(response.data);
      })
      .catch(error => console.error("Failed to fetch achievements", error))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="text-center text-gray-400">Loading achievements...</p>;

  return (
    <div className="w-full mt-10">
      <h2 className="text-3xl font-bold mb-6 text-center text-cyan-300">My Achievements</h2>
      {achievements.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {achievements.map(({ earned_at, achievements: ach }) => (
            <div key={ach.id} className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm p-4 rounded-xl border border-cyan-400/20 text-center flex flex-col items-center hover:border-cyan-300/40 transition-all duration-300 hover:scale-105 shadow-lg" title={`${ach.name.en} - Earned: ${new Date(earned_at).toLocaleDateString()}`}>
              <img 
                src={ach.icon_url} 
                alt={ach.name.en} 
                className="w-24 h-24 mb-4 rounded-full bg-cyan-800/20 object-cover border-2 border-cyan-400/30 shadow-md"
                onError={(e) => {
                  console.error('Failed to load achievement icon:', ach.icon_url);
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkY3NzMzIi8+Cjwvc3ZnPgo=';
                }}
                
              />
              <h3 className="text-md font-bold text-cyan-100">{ach.name.en}</h3>
              <p className="text-xs text-cyan-200/70 mt-2 flex-grow">{ach.description.en}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-8 rounded-xl border border-cyan-400/20">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-cyan-200/70">You haven't earned any achievements yet. Keep playing!</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsList;

