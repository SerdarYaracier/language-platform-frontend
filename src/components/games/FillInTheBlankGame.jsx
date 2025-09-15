import React, { useState, useEffect, useContext, useRef } from 'react';
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

  const GAME_KEY_BASE = 'seenIds:fill-in-the-blank';

  const getKey = () => {
    // Per-category+level key so different levels/categories don't share seen ids
    return `${GAME_KEY_BASE}:${categorySlug || 'global'}:${level || 1}`;
  };

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
  const setSeenIdsDirect = (key, arr) => {
    localStorage.setItem(key, JSON.stringify(arr || []));
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

    // If category required and not provided (and not MixedRush), redirect
    if (!categorySlug && !isMixedRush) {
      navigate('/categories/fill-in-the-blank');
      return;
    }

    // Build per-level key and seen ids
    const key = getKey();
    const seenIdsArr = getSeenIds(key);

    // If we've already seen 5 questions for this level, mark complete
    if (seenIdsArr.length >= 5) {
      setFeedback("Congratulations! You've completed all questions in this level.");
      setIsLoading(false);
      return;
    }

    // If initialData is provided by parent (e.g. MixedRush) use it
    if (initialData) {
      const id = getGameId(initialData);
      if (isSeen(key, id)) {
        setFeedback('No new questions available.');
        setIsLoading(false);
        return;
      }
      setGameData(initialData);
      setCurrentGameId(id);
      // Mark as seen immediately to avoid repeats
      addSeen(key, id);
      setIsLoading(false);
      return;
    }

    // Send seen_ids to backend so server excludes them
    const seenParam = seenIdsArr.length ? `&seen_ids=${seenIdsArr.join(',')}` : '';
    const base = `${API_URL}/api/games/fill-in-the-blank?lang=${encodeURIComponent(targetLang)}`;
    const url = categorySlug
      ? `${base}&category=${encodeURIComponent(categorySlug)}${level ? `&level=${encodeURIComponent(level)}` : ''}${seenParam}`
      : `${base}${level ? `&level=${encodeURIComponent(level)}` : ''}${seenParam}`;

    try {
      const response = await api.get(url);
      const data = response.data;

      // If backend returns empty object => no more questions
      if (!data || Object.keys(data).length === 0) {
        setFeedback("Congratulations! You've completed all questions in this level.");
        setIsLoading(false);
        return;
      }

      const id = getGameId(data);
      // If backend somehow returned a seen id, skip it (defensive)
      if (id && isSeen(key, id)) {
        // Try again once (server should have excluded, but fallback)
        // add to local seen to avoid infinite loop then mark complete if needed
        addSeen(key, id);
        const newSeen = getSeenIds(key);
        if (newSeen.length >= 5) {
          setFeedback("Congratulations! You've completed all questions in this level.");
          setIsLoading(false);
          return;
        }
        // try fetch again
        setIsLoading(false);
        return fetchGame();
      }

      // Accept and mark seen immediately so it's not returned again
      setGameData(data);
      setCurrentGameId(id);
      if (id) addSeen(key, id);

      // If we've now reached 5 seen questions, and user hasn't answered them,
      // we still allow answering; but future fetches will show completion.

      setIsLoading(false);
      return;
    } catch (error) {
      console.error("Failed to fetch game data!", error);
      setFeedback("Could not load the game. Please try again.");
      setIsLoading(false);
      return;
    }
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

    // reset transient state when level/category changes
    setFeedback('');
    setSelectedOption(null);
    setGameData(null);
    setIsLoading(true);

    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // currentGameId already marked as seen during fetch; ensure persisted
      const key = getKey();
      if (currentGameId) addSeen(key, currentGameId);

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

  // show completion when seen 5 items
  const keyNow = getKey();
  const seenCountNow = getSeenIds(keyNow).length;
  if (seenCountNow >= 5 && !gameData) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-2xl mx-auto text-center">
        <h2 className="text-2xl text-green-400 font-bold mb-6">Level Complete</h2>
        <p className="mb-6">You've completed all questions in this level.</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/levels/fill-in-the-blank/${categorySlug}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          >
            Back to Levels
          </button>

          {/* Yeni: Kullanıcının aynı levele tekrar girip testi yeniden çözebilmesi için Retry butonu */}
          <button
            onClick={() => {
              // temizle ve tekrar başlat
              setSeenIdsDirect(keyNow, []);
              setFeedback('');
              setIsLoading(true);
              fetchGame();
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded"
          >
            Retry Level
          </button>

          {level < 5 && (
            <button
              onClick={() => {
                // reset seen ids for next level navigation
                const nextKey = `${GAME_KEY_BASE}:${categorySlug}:${parseInt(level) + 1}`;
                setSeenIdsDirect(nextKey, []);
                navigate(`/game/fill-in-the-blank/${categorySlug}/${parseInt(level) + 1}`);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    );
  }

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
