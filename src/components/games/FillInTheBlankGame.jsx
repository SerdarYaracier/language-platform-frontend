import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { LanguageContext } from '../../context/LanguageContext'; // Dosya yolu güncellendi
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const FillInTheBlankGame = ({ initialData, onCorrectAnswer, categorySlug, level, isMixedRush }) => {
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const { refreshProfile } = useAuth();
  const [gameData, setGameData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState(null);
  const nextTimeoutRef = useRef(null);

  const GAME_KEY = 'seenIds:fill-in-the-blank';
  const getGameId = (d) => d?.id || d?.game_id || d?._id || null;
  const getSeenIds = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  };
  const isSeen = (key, id) => !!id && getSeenIds(key).includes(id);
  const addSeen = (key, id) => {
    if (!id) return;
    const arr = getSeenIds(key);
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  };

  const fetchGame = async () => {
    // clear any pending auto-next timeout when fetching a new question
    if (nextTimeoutRef.current) {
      clearTimeout(nextTimeoutRef.current);
      nextTimeoutRef.current = null;
    }

    setIsLoading(true);
    setGameData(null);
    setSelectedOption(null);
    setFeedback('');
    setCurrentGameId(null);

  if (initialData) {
      const id = getGameId(initialData);
      if (isSeen(GAME_KEY, id)) {
        setFeedback('No new questions available.');
        setIsLoading(false);
        return;
      }
      setGameData(initialData);
      setCurrentGameId(id);
      setIsLoading(false);
      return;
    }

    let attempts = 5;
    while (attempts > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        // include category and level params when available; MixedRush will call without category
        const base = `${API_URL}/api/games/fill-in-the-blank?lang=${encodeURIComponent(targetLang)}`;
        const url = categorySlug
          ? `${base}&category=${encodeURIComponent(categorySlug)}${level ? `&level=${encodeURIComponent(level)}` : ''}`
          : `${base}${level ? `&level=${encodeURIComponent(level)}` : ''}`;
        // If we're running inside MixedRush, the parent provides initialData; don't fetch here
        if (isMixedRush) {
          setIsLoading(false);
          return;
        }

        const response = await api.get(url);
        const id = getGameId(response.data);
        if (id && isSeen(GAME_KEY, id)) {
          attempts -= 1;
          continue;
        }
        setGameData(response.data);
        setCurrentGameId(id);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Failed to fetch game data!", error);
        setFeedback("Could not load the game. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    setFeedback('No new questions available.');
    setIsLoading(false);
  };

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nextTimeoutRef.current) {
        clearTimeout(nextTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // If categorySlug is required by the backend, redirect user to selection page
    if (!categorySlug && !isMixedRush) {
      navigate('/categories/fill-in-the-blank');
      return;
    }

    fetchGame();
  }, [targetLang, categorySlug, level, isMixedRush]);

  const submitScore = async () => {
    if (isMixedRush) return;
    try {
      await api.post('/api/progress/submit-score', {
        gameSlug: 'fill-in-the-blank',
        categorySlug: categorySlug,
        level: level,
      });
      console.log('Score submitted for fill-in-the-blank');
  if (typeof refreshProfile === 'function') refreshProfile();
    } catch (error) {
      console.error('Failed to submit score', error);
    }
  };

  const handleOptionClick = (option) => {
    if (feedback) return;

    setSelectedOption(option);
    if (option === gameData.answer) {
      setFeedback('Correct!');
      if (currentGameId) addSeen(GAME_KEY, currentGameId);
      if (typeof onCorrectAnswer === 'function') {
        setTimeout(onCorrectAnswer, 1000);
      } else {
        submitScore();
        // auto-advance to next question after 1s
        nextTimeoutRef.current = setTimeout(() => {
          setFeedback('');
          fetchGame();
        }, 1000);
      }
    } else {
      setFeedback('Wrong!');
    }
  };

  const getButtonClass = (option) => {
    if (!feedback) return 'bg-gray-600 hover:bg-gray-500';
    if (option === gameData.answer) return 'bg-green-600';
    if (option === selectedOption && option !== gameData.answer) return 'bg-red-600';
    return 'bg-gray-700 opacity-50';
  };

  if (isLoading) {
    return <div className="text-center text-xl">Loading Game...</div>;
  }

  if (!gameData) {
    return <div className="text-center text-xl text-red-400">{feedback}</div>;
  }

  return (
    <div className="bg-gray-800 p-8 rounded-lg w-full max-w-2xl mx-auto text-center">
      <h2 className="text-2xl text-green-400 font-bold mb-6">Fill in the Blank</h2>
      
      <div className="bg-gray-900 rounded-md p-6 mb-8 text-2xl h-24 flex items-center justify-center">
        <p className="text-white tracking-wide">
          {gameData.sentence_parts[0]}
          <span className="inline-block bg-gray-700 text-gray-700 rounded mx-2 px-10 select-none">
            {feedback ? gameData.answer : '____'}
          </span>
          {gameData.sentence_parts[1]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {gameData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            disabled={!!feedback}
            className={`w-full text-white font-bold py-3 px-4 rounded transition duration-300 ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="mt-6">
          <p className={`text-3xl font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>
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

export default FillInTheBlankGame;
