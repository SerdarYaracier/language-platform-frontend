import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { LanguageContext } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const ImageMatchGame = ({ initialData, onCorrectAnswer, categorySlug, level, isMixedRush }) => {
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const { refreshProfile } = useAuth();
  const [gameData, setGameData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [seenQuestionIds, setSeenQuestionIds] = useState([]);
  const seenQuestionIdsRef = useRef([]);

  // seenQuestionIds değiştiğinde ref'i güncelle
  useEffect(() => {
    seenQuestionIdsRef.current = seenQuestionIds;
  }, [seenQuestionIds]);

  const fetchGame = async () => {
    // MixedRush bu mantığı kullanmaz, çünkü sorular dışarıdan gelir.
    if (isMixedRush) {
      if(initialData) {
        setGameData(initialData);
        setIsLoading(false);
      }
      return;
    }
    
    // Normal modda, kategori ve seviye bilgisi zorunludur.
    if (!categorySlug || !level) {
      navigate(`/categories/image-match`);
      return;
    }

    setIsLoading(true);
    setGameData(null);
    setSelectedOption(null);
    setFeedback('');

    // Current seen IDs'i ref'ten al (güncel değer)
    const currentSeenIds = seenQuestionIdsRef.current;
    const seenIdsParam = currentSeenIds.join(',');
    const lang = targetLang || 'en';
    
    console.log(`[ImageMatch] Fetching game - seen IDs: [${seenIdsParam}], total seen: ${currentSeenIds.length}`);
    
    const url = `/api/games/image-match?lang=${lang}&category=${categorySlug}&level=${level}&seen_ids=${seenIdsParam}`;
    
    try {
      const response = await api.get(url);

      console.log(`[ImageMatch] Backend response:`, response.data);

      // Backend boş nesne döndürürse tüm sorular bitmiş
      if (!response.data || Object.keys(response.data).length === 0) {
        console.log(`[ImageMatch] No more questions available - level complete`);
        setFeedback("Congratulations! You've completed all questions in this level.");
        setGameData(null);
        setIsLoading(false);
        return;
      }
      
      setGameData(response.data);
      
      // Gelen yeni sorunun ID'sini görülenler listesine ekle - sadece yeni sorular için
      if (response.data.id) {
        console.log(`[ImageMatch] Adding question ID ${response.data.id} to seen list`);
        setSeenQuestionIds(prevIds => {
          const newIds = [...prevIds, response.data.id];
          console.log(`[ImageMatch] Updated seen IDs: [${newIds.join(',')}]`);
          return newIds;
        });
      }

    } catch (err) {
      console.error(`[ImageMatch] Error fetching game:`, err);
      let msg = 'Could not load the game.';
      if (err.response?.status === 404) {
        msg = 'Game data not found.';
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setFeedback(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // İlk yükleme için özel fonksiyon
  const loadInitialGame = async () => {
    if (isMixedRush) {
      if(initialData) {
        setGameData(initialData);
        setIsLoading(false);
      }
      return;
    }
    
    if (!categorySlug || !level) {
      navigate(`/categories/image-match`);
      return;
    }

    setIsLoading(true);
    const lang = targetLang || 'en';
    const url = `/api/games/image-match?lang=${lang}&category=${categorySlug}&level=${level}&seen_ids=`;
    
    try {
      const response = await api.get(url);
      console.log(`[ImageMatch] Initial game loaded:`, response.data);

      if (!response.data || Object.keys(response.data).length === 0) {
        setFeedback("No questions available for this level.");
        setGameData(null);
        setIsLoading(false);
        return;
      }
      
      setGameData(response.data);
      
      // İlk sorunun ID'sini kaydet
      if (response.data.id) {
        console.log(`[ImageMatch] Initial question ID: ${response.data.id}`);
        setSeenQuestionIds([response.data.id]);
      }

    } catch (err) {
      console.error(`[ImageMatch] Error loading initial game:`, err);
      setFeedback('Could not load the game.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset transient state when level/category/lang changes so previous feedback
    // (e.g. "Congratulations!") doesn't persist into the next level.
    setFeedback('');
    setSelectedOption(null);
    setGameData(null);
    setIsLoading(true);
    setSeenQuestionIds([]);

    if (initialData) {
      setGameData(initialData);
      setIsLoading(false);
      // İlk veri için de ID'yi kaydet (varsa)
      if (initialData.id) {
        console.log(`[ImageMatch] Initial data ID: ${initialData.id}`);
        setSeenQuestionIds([initialData.id]);
      }
    } else {
      loadInitialGame(); // İlk yükleme için özel fonksiyon kullan
    }
  }, [initialData, targetLang, categorySlug, level, isMixedRush]);

  const submitScore = async () => {
    if (isMixedRush) return;
    try {
      await api.post('/api/progress/submit-score', {
        gameSlug: 'image-match',
        categorySlug: categorySlug,
        level: level,
      });
      if (typeof refreshProfile === 'function') refreshProfile();
    } catch (error) {
      console.error('Failed to submit score', error);
    }
  };

  const handleOptionClick = (option) => {
    if (feedback) return;
    setSelectedOption(option);

    if (option === gameData?.answer) {
      setFeedback('Correct!');
      if (typeof onCorrectAnswer === 'function') {
        setTimeout(onCorrectAnswer, 1500);
      } else {
        submitScore();
        setTimeout(() => {
          fetchGame(); // Bir sonraki soruyu getir
        }, 1500);
      }
    } else {
      setFeedback(`Wrong! Correct answer: ${gameData.answer}`);
      // Yanlış cevap durumunda otomatik geçiş yok
    }
  };

  const handleNextQuestion = () => {
    fetchGame();
  };

  const getButtonClass = (option) => {
    if (!feedback) return 'bg-gray-600 hover:bg-gray-500';
    if (option === gameData?.answer) return 'bg-green-600';
    if (option === selectedOption && option !== gameData?.answer) return 'bg-red-600';
    return 'bg-gray-700 opacity-50';
  };

  if (isLoading) {
    return <div className="text-center text-xl">Loading Game...</div>;
  }

  // Level/kategori bittiğinde gösterilecek özel durum
  if (!gameData && feedback.includes("Congratulations")) {
    return (
        <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md mx-auto text-center">
            <h2 className="text-2xl text-green-400 font-bold mb-4">Level Complete!</h2>
            <p className="text-white mb-6">{feedback}</p>
            <div className="flex gap-4 justify-center">
              <button
                  onClick={() => navigate(`/levels/image-match/${categorySlug}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
              >
                  Back to Levels
              </button>
              {level < 5 && (
                <button
                    onClick={() => navigate(`/game/image-match/${categorySlug}/${parseInt(level) + 1}`)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                >
                    Next Level
                </button>
              )}
            </div>
        </div>
    );
  }

  if (!gameData) {
    return <div className="text-center text-xl text-red-400">{feedback || 'No game data.'}</div>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-auto text-center">
      <h2 className="text-2xl text-purple-400 font-bold mb-4">Match the Image</h2>
      
      {/* Debug bilgisi */}
      <div className="text-xs text-gray-500 mb-4">
        Questions seen: {seenQuestionIds.length}/5 | Current ID: {gameData.id}
      </div>
      
      <div className="mb-6">
        <div className="relative w-full h-64 overflow-hidden rounded-lg bg-gray-700 shadow-lg">
          <img
            src={gameData.image_url}
            alt="Match this image"
            className="absolute inset-0 w-full h-full object-contain object-center"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full flex-col items-center justify-center">
            <p className="text-gray-400">Image not available</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {gameData.options?.map((option, index) => (
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
          <p className={`text-2xl font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback}
          </p>
          {feedback !== 'Correct!' && (
            <button
              onClick={handleNextQuestion}
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

