import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const LevelSelectionPage = () => {
  const { gameSlug, categorySlug } = useParams();
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gameSlug || !categorySlug) return;

    axios.get(`${API_URL}/api/games/${gameSlug}/${categorySlug}/levels`)
      .then(response => {
        setLevels(response.data);
      })
      .catch(error => console.error("Failed to fetch levels", error))
      .finally(() => setIsLoading(false));
  }, [gameSlug, categorySlug]);

  if (isLoading) return <p>Loading levels...</p>;

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Choose a Level</h1>
      <div className="flex justify-center flex-wrap gap-6">
        {levels.length > 0 ? (
          levels.map(level => (
            <Link
              key={level}
              to={`/game/${gameSlug}/${categorySlug}/${level}`}
              className="bg-gray-800 hover:bg-emerald-800 w-40 h-40 flex items-center justify-center rounded-lg transition-transform transform hover:scale-105"
            >
              <h2 className="text-3xl font-bold text-emerald-400">
                Level {level}
              </h2>
            </Link>
          ))
        ) : (
          <p className="text-gray-400">No levels found for this category yet.</p>
        )}
      </div>
    </div>
  );
};

export default LevelSelectionPage;