
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LanguageContext } from '../../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ImageMatchGame = ({ initialData, onCorrectAnswer, categorySlug, level, isMixedRush }) => {
  // Debug loglar kaldırıldı
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const [gameData, setGameData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // useEffect'i useCallback içine alarak daha stabil hale getiriyoruz
  const fetchGame = React.useCallback(async () => {
    // Basic validations
    if (!API_URL) {
      console.error('VITE_API_BASE_URL is not set');
      setFeedback('Server not configured (missing API URL).');
      setIsLoading(false);
      return;
    }

    const lang = targetLang || 'en'; // fallback to english if not set

    setIsLoading(true);
    setGameData(null);
    setSelectedOption(null);
    setFeedback('');

    // If initialData provided (from MixedRush), use it
    if (initialData) {
      setGameData(initialData);
      setIsLoading(false);
      return;
    }

    // If no categorySlug and not running inside MixedRush, redirect to selection
    if (!categorySlug && !isMixedRush) {
      console.warn('No categorySlug provided to ImageMatchGame — redirecting to selection.');
      navigate('/categories/image-match');
      return;
    }

    // include category and level params when provided
    const base = `${API_URL}/api/games/image-match?lang=${encodeURIComponent(lang)}`;
    const url = categorySlug
      ? `${base}&category=${encodeURIComponent(categorySlug)}${level ? `&level=${encodeURIComponent(level)}` : ''}`
      : `${base}${level ? `&level=${encodeURIComponent(level)}` : ''}`;
    console.debug('Fetching ImageMatchGame:', url);

    try {
      const response = await axios.get(url);
      if (!response || !response.data) {
        setFeedback('No data returned from server.');
        return;
      }
      setGameData(response.data);
    } catch (err) {
      let msg = 'Could not load the game.';
      if (err.response && err.response.status === 404) {
        msg += ' (Game data not found. Please check category or try another.)';
      } else if (err.response) {
        msg += ` Server returned ${err.response.status}.`;
        if (err.response.data && err.response.data.message) msg += ` ${err.response.data.message}`;
      } else if (err.request) {
        msg += ' No response from server.';
      } else {
        msg += ` ${err.message}`;
      }
      setFeedback(msg);
    } finally {
      setIsLoading(false);
    }
  }, [targetLang, categorySlug, level]); // Bağımlılıkları ekliyoruz

  useEffect(() => {
    if (!categorySlug && !isMixedRush) {
      // If this component was mounted without a category, send user back to selection
      navigate('/categories/image-match');
      return;
    }

    fetchGame();
  }, [fetchGame]); // fetchGame fonksiyonu değiştiğinde (yani bağımlılıkları değiştiğinde) useEffect'i tekrar çalıştır

  const handleOptionClick = (option) => {
    if (feedback) return;

    setSelectedOption(option);
    if (option === (gameData && gameData.answer)) {
      setFeedback('Correct!');
      
      if (typeof onCorrectAnswer === 'function') {
        // MixedRush modunda, onCorrectAnswer callback'ini çağır
        onCorrectAnswer();
      } else {
        // Normal modda, otomatik olarak sonraki soruya geç
        setTimeout(() => {
          setFeedback('');
          fetchGame();
        }, 1000); // 1 saniye bekle, sonra yeni soruyu getir
      }
    } else {
      setFeedback('Wrong!');
    }
  };

  const getButtonClass = (option) => {
    if (!feedback) {
      return 'bg-gray-600 hover:bg-gray-500';
    }
    if (option === gameData.answer) {
      return 'bg-green-600';
    }
    if (option === selectedOption && option !== gameData.answer) {
      return 'bg-red-600';
    }
    return 'bg-gray-700 opacity-50';
  };

  if (isLoading) {
    return <div className="text-center text-xl">Loading Game...</div>;
  }

  if (!gameData) {
    return <div className="text-center text-xl text-red-400">{feedback || 'No game data.'}</div>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-auto text-center">
      <h2 className="text-2xl text-purple-400 font-bold mb-4">Match the Image</h2>
      <div className="mb-6">
        <img
          src={gameData.image_url}
          alt="Match this image"
          className="rounded-lg shadow-lg mx-auto max-w-full max-h-64 w-auto h-auto object-contain"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.isArray(gameData.options) && gameData.options.length > 0 ? (
          gameData.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              disabled={!!feedback}
              className={`w-full text-white font-bold py-3 px-4 rounded transition duration-300 ${getButtonClass(option)}`}
            >
              {option}
            </button>
          ))
        ) : (
          <div className="col-span-2 text-center text-yellow-300">No options available for this question.</div>
        )}
      </div>

      {feedback && (
        <div className="mt-6">
          <p className={`text-2xl font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback}
          </p>
          {feedback === 'Wrong!' && (
            <button
              onClick={fetchGame}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            >
              Next Question
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageMatchGame;
