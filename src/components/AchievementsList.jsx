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
          <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">My Achievements</h2>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {achievements.map(({ earned_at, achievements: ach }) => (
                <div key={ach.id} className="bg-gray-800 p-4 rounded-lg text-center flex flex-col items-center" title={`${ach.name.en} - Earned: ${new Date(earned_at).toLocaleDateString()}`}>
                  <img src={ach.icon_url} alt={ach.name.en} className="w-24 h-24 mb-4 rounded-full bg-gray-700" />
                  <h3 className="text-md font-bold text-white">{ach.name.en}</h3>
                  <p className="text-xs text-gray-400 mt-2 flex-grow">{ach.description.en}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">You haven't earned any achievements yet. Keep playing!</p>
          )}
        </div>
      );
    };

    export default AchievementsList;
    
