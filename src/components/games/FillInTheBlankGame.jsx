import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { LanguageContext } from '../../context/LanguageContext'; // Dosya yolu güncellendi
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;
// Supabase bucket for decorative game assets
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

const FillInTheBlankGame = ({ initialData, onCorrectAnswer, onWrongAnswer, categorySlug, level, isMixedRush }) => {
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
        setTimeout(onCorrectAnswer, 300);
      } else {
        submitScore();
        // auto-advance to next question after 0.3s
        nextTimeoutRef.current = setTimeout(() => {
          setFeedback('');
          fetchGame();
        }, 300);
      }
    } else {
      setFeedback('Wrong!');
      
      // MixedRush modunda yanlış cevap için özel işlem
      if (isMixedRush && typeof onWrongAnswer === 'function') {
        setTimeout(onWrongAnswer, 300);
      }
      // Normal modda manuel "Next Question" butonu var
    }
  };

  const getButtonClass = (option) => {
    const base = 'w-full text-white font-bold py-3 px-4 rounded transition duration-300 transform border backdrop-blur-sm text-lg';
    // Daha mat / daha az parlak cyan tonu: biraz daha koyu, hafif opak ve gölge küçültüldü
    if (!feedback) return `${base} bg-gradient-to-r from-cyan-600/80 to-cyan-700/80 hover:from-cyan-600/95 hover:to-cyan-700/95 border-cyan-300/20 hover:scale-[1.02] shadow-sm`;
    if (option === gameData.answer) return `${base} bg-gradient-to-r from-green-600 to-green-700 border-green-400/30 shadow-lg scale-[1.02]`;
    if (option === selectedOption && option !== gameData.answer) return `${base} bg-gradient-to-r from-red-600 to-red-700 border-red-400/30 shadow-lg scale-[1.02]`;
    return `${base} bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600/30 opacity-60`;
  };

  // show completion when seen 5 items
  const keyNow = getKey();
  const seenCountNow = getSeenIds(keyNow).length;
  if (seenCountNow >= 5 && !gameData) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm p-6 rounded-2xl w-full max-w-xl mx-auto text-center border border-cyan-400/30 animate-in zoom-in-95 duration-500 shadow-lg">
        <div className="mb-4 animate-bounce">
          <img
            src={`${SUPABASE_BUCKET_URL}/clap_gecko.png`}
            alt="clap gecko"
            className="w-24 h-24 mx-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <h2 className="text-2xl text-cyan-300 font-bold mb-4">Level Complete</h2>
        <p className="mb-4 text-cyan-100">You've completed all questions in this level.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate(`/levels/fill-in-the-blank/${categorySlug}`)}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30"
          >
            Back to Levels
          </button>

          <button
            onClick={() => {
              // temizle ve tekrar başlat
              setSeenIdsDirect(keyNow, []);
              setFeedback('');
              setIsLoading(true);
              fetchGame();
            }}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30"
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
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-green-400/30"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-6 rounded-2xl w-full max-w-lg mx-auto text-center border border-cyan-400/20 animate-pulse">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <div className="text-lg text-cyan-200">Loading Game...</div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 p-6 rounded-2xl w-full max-w-lg mx-auto text-center border border-red-400/20">
        <div className="text-lg text-red-300">{feedback}</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-6 rounded-2xl w-full max-w-xl mx-auto text-center border border-cyan-400/30 shadow-2xl animate-in fade-in-50 duration-500">
      <h2 className="text-2xl text-cyan-300 font-bold mb-4">Fill in the Blank</h2>
      
      <div className="bg-gradient-to-br from-cyan-800/30 to-cyan-900/30 rounded-xl p-5 mb-6 text-xl h-24 flex items-center justify-center border border-cyan-400/20">
        <p className="text-cyan-50 tracking-wide">
          {gameData.sentence_parts[0]}
          <span className="inline-block bg-cyan-700/60 text-white rounded mx-2 px-8 py-1 select-none shadow-inner transition-all duration-300">
            {feedback ? gameData.answer : '____'}
          </span>
          {gameData.sentence_parts[1]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {gameData.options.map((option, index) => (
          <div key={index} className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 70}ms` }}>
            <button
              onClick={() => handleOptionClick(option)}
              disabled={!!feedback}
              className={getButtonClass(option)}
            >
              {option}
            </button>
          </div>
        ))}
      </div>

      {feedback && (
        <div className="mt-5 text-center animate-in slide-in-from-bottom-3 duration-400">
          <div className={`inline-flex items-center gap-3 p-3 rounded-lg backdrop-blur-sm border text-lg font-bold mb-3 ${
            feedback === 'Correct!' ? 'text-green-300 bg-green-900/30 border-green-400/30' : 'text-red-300 bg-red-900/30 border-red-400/30'
          }`}>
            <img
              src={`${SUPABASE_BUCKET_URL}/${feedback === 'Correct!' ? 'happy_gecko.png' : 'sad_gecko.png'}`}
              alt={feedback === 'Correct!' ? 'happy gecko' : 'sad gecko'}
              className="w-8 h-8 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span>{feedback}</span>
          </div>
           {feedback === 'Wrong!' && !isMixedRush && (
             <div>
               <button
                 onClick={fetchGame}
                 className="mt-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30"
               >
                 Next Question
               </button>
             </div>
           )}
         </div>
       )}
    </div>
  );
};

export default FillInTheBlankGame;
