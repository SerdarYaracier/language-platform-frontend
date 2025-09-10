import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom'; // useParams'i import ettiğinizden emin olun
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CategorySelectionPage = () => {
  // 1. URL'den oyunun slug'ını alıyoruz (örn: 'image-match', 'sentence-scramble')
  const { gameSlug } = useParams(); 
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { targetLang } = useContext(LanguageContext);

  useEffect(() => {
    // gameSlug'ın tanımsız olmaması için bir kontrol
    if (!gameSlug) return; 

    setIsLoading(true);
    setErrorMsg('');
    // 2. API isteğini URL'den gelen gameSlug'a göre DİNAMİK olarak yapıyoruz
    axios.get(`${API_URL}/api/games/${gameSlug}/categories`)
      .then(response => {
        setCategories(response.data);
      })
      .catch(error => {
        console.error(`Failed to fetch categories for ${gameSlug}`, error);
        setErrorMsg('Could not load categories for this game.');
      })
      .finally(() => setIsLoading(false));
  }, [gameSlug]); // gameSlug değiştiğinde tekrar veri çekmesini sağlıyoruz

  if (isLoading) return <p>Loading categories...</p>;

  if (errorMsg) return <p className="text-red-400">{errorMsg}</p>;

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Choose a Category</h1>
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <Link
            key={category.id}
            // Link artık /levels/... adresine gidiyor
            to={`/levels/${gameSlug}/${category.slug}`}
            className="bg-gray-800 hover:bg-gray-700 p-8 rounded-lg transition-transform transform hover:scale-105"
            >
            <h2 className="text-2xl font-bold text-white">
                {category.name[targetLang] || category.name['en']}
            </h2>
            </Link>

          ))}
        </div>
      ) : (
        <p className="text-gray-400">No categories found for this game yet. Add some from the admin panel!</p>
      )}
    </div>
  );
};

export default CategorySelectionPage;