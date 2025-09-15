import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CategorySelectionPage = () => {
  const { gameSlug } = useParams(); 
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { targetLang } = useContext(LanguageContext);

  // Game titles mapping for display
  const gameNames = {
    'sentence-scramble': 'Sentence Scramble',
    'image-match': 'Image Match',
    'fill-in-the-blank': 'Fill in the Blank',
    'mixed-rush': 'Mixed Rush'
  };

  useEffect(() => {
    if (!gameSlug) return; 

    setIsLoading(true);
    setErrorMsg('');
    axios.get(`${API_URL}/api/games/${gameSlug}/categories`)
      .then(response => {
        setCategories(response.data);
      })
      .catch(error => {
        console.error(`Failed to fetch categories for ${gameSlug}`, error);
        setErrorMsg('Could not load categories for this game.');
      })
      .finally(() => setIsLoading(false));
  }, [gameSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-900/10 to-cyan-800/10 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-8 rounded-2xl text-center border border-cyan-400/20 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-xl text-cyan-200">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-900/10 to-cyan-800/10 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-8 rounded-2xl text-center border border-red-400/30">
          <div className="text-2xl text-red-300 mb-4">⚠️</div>
          <div className="text-xl text-red-300">{errorMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900/10 to-cyan-800/10 backdrop-blur-sm p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-12 animate-in fade-in-50 duration-700">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-cyan-100 bg-clip-text text-transparent">
            Choose a Category
          </h1>
          <p className="text-xl text-cyan-200/80 mb-2">
            Select a category for <span className="font-semibold text-cyan-300">{gameNames[gameSlug] || gameSlug}</span>
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 mx-auto rounded-full"></div>
        </div>

        {/* Categories grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link
                  to={`/levels/${gameSlug}/${category.slug}`}
                  className="group block bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-cyan-400/20 hover:border-cyan-300/40 hover:from-cyan-800/40 hover:to-cyan-700/40"
                >
                  {/* Category icon/emoji based on name */}
                  <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
                    {category.name.en?.toLowerCase().includes('animal') && '🐾'}
                    {category.name.en?.toLowerCase().includes('food') && '🍽️'}
                    {category.name.en?.toLowerCase().includes('color') && '🎨'}
                    {category.name.en?.toLowerCase().includes('number') && '🔢'}
                    {category.name.en?.toLowerCase().includes('family') && '👨‍👩‍👧‍👦'}
                    {category.name.en?.toLowerCase().includes('house') && '🏠'}
                    {category.name.en?.toLowerCase().includes('transport') && '🚗'}
                    {category.name.en?.toLowerCase().includes('nature') && '🌿'}
                    {category.name.en?.toLowerCase().includes('body') && '👤'}
                    {category.name.en?.toLowerCase().includes('cloth') && '👕'}
                    {!category.name.en?.toLowerCase().match(/(animal|food|color|number|family|house|transport|nature|body|cloth)/) && '📚'}
                  </div>
                  
                  <h2 className="text-xl font-bold text-cyan-100 text-center group-hover:text-white transition-colors duration-300">
                    {category.name[targetLang] || category.name['en']}
                  </h2>
                  
                  {/* Hover indicator */}
                  <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="inline-block bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
                      Start Learning →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center animate-in fade-in-50 duration-500">
            <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-12 rounded-2xl border border-cyan-400/20 max-w-md mx-auto">
              <div className="text-6xl mb-6">📚</div>
              <p className="text-xl text-cyan-200 mb-4">No categories available</p>
              <p className="text-cyan-300/70">
                Categories for this game haven't been added yet. Check back later!
              </p>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="text-center mt-12 animate-in fade-in-50 duration-700">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600/80 to-cyan-700/80 hover:from-cyan-600/95 hover:to-cyan-700/95 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/20 backdrop-blur-sm"
          >
            <span>←</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategorySelectionPage;