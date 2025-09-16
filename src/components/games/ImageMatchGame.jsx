import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { LanguageContext } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

// Supabase public bucket for decorative assets (gecko icons)
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

const ImageMatchGame = ({ initialData, onCorrectAnswer, onWrongAnswer, categorySlug, level, isMixedRush }) => {
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const { refreshProfile } = useAuth();
  const [gameData, setGameData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [lastResult, setLastResult] = useState(null); // 'correct' | 'wrong' | null
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
    setLastResult(null);

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
    setLastResult(null);

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
      setLastResult('correct');
      if (typeof onCorrectAnswer === 'function') {
        setTimeout(onCorrectAnswer, 300);
      } else {
        submitScore();
        setTimeout(() => {
          fetchGame(); // Bir sonraki soruyu getir
        }, 1500);
      }
    } else {
      setFeedback(`Wrong! Correct answer: ${gameData.answer}`);
      setLastResult('wrong');
      
      // MixedRush modunda yanlış cevap için özel işlem
      if (isMixedRush && typeof onWrongAnswer === 'function') {
        setTimeout(onWrongAnswer, 300);
      }
      // Normal modda otomatik geçiş yok
    }
  };

  const handleNextQuestion = () => {
    fetchGame();
  };

  const getButtonClass = (option) => {
    const baseClasses = 'w-full text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform border backdrop-blur-sm text-lg';
    
    if (!feedback) {
      return `${baseClasses} bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-gray-500/30 hover:scale-[1.02] shadow-md hover:shadow-lg`;
    }
    
    if (option === gameData?.answer) {
      return `${baseClasses} bg-gradient-to-r from-green-600 to-green-700 border-green-400/30 shadow-lg scale-[1.02]`;
    }
    
    if (option === selectedOption && option !== gameData?.answer) {
      return `${baseClasses} bg-gradient-to-r from-red-600 to-red-700 border-red-400/30 shadow-lg scale-[1.02]`;
    }
    
    return `${baseClasses} bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600/30 opacity-60`;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-6 rounded-2xl w-full max-w-md mx-auto text-center border border-cyan-400/30 animate-pulse">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <div className="text-xl text-cyan-200">Loading Game...</div>
      </div>
    );
  }

  // Level/kategori bittiğinde gösterilecek özel durum
  if (!gameData && feedback.includes("Congratulations")) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm p-6 rounded-2xl w-full max-w-md mx-auto text-center border border-cyan-400/30 animate-in zoom-in-95 duration-500">
        <div className="mb-4 animate-bounce">
          <img
            src={`${SUPABASE_BUCKET_URL}/clap_gecko.png`}
            alt="clap gecko"
            className="w-24 h-24 mx-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <h2 className="text-2xl text-cyan-300 font-bold mb-4">Level Complete!</h2>
        <p className="text-cyan-100 mb-6">{feedback}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate(`/levels/image-match/${categorySlug}`)}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30"
          >
            Back to Levels
          </button>
          <button
            onClick={() => {
              setSeenQuestionIds([]);
              setFeedback('');
              setIsLoading(true);
              loadInitialGame();
            }}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30"
          >
            Retry Level
          </button>
          {level < 5 && (
            <button
              onClick={() => navigate(`/game/image-match/${categorySlug}/${parseInt(level) + 1}`)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-green-400/30"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-6 rounded-2xl w-full max-w-md mx-auto text-center border border-red-400/30">
        <div className="text-xl text-red-300">{feedback || 'No game data.'}</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-6 rounded-2xl w-full max-w-xl mx-auto border border-cyan-400/30 shadow-2xl animate-in fade-in-50 duration-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl text-cyan-300 font-bold mb-1 bg-gradient-to-r from-cyan-300 to-cyan-100 bg-clip-text text-transparent">
          Match the Image
        </h2>
        <p className="text-cyan-200/80 mb-3 text-base">
          Select the word that matches the image.
        </p>
        
        {/* Progress indicator */}
        <div className="bg-cyan-900/30 rounded-full p-2 mb-4 inline-block border border-cyan-400/20">
          <div className="text-sm text-cyan-200 font-medium">
            Question {seenQuestionIds.length} of 5
          </div>
          <div className="w-28 bg-cyan-900/50 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(seenQuestionIds.length / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Image container */}
      <div className="mb-6 animate-in fade-in-50 slide-in-from-top-2 duration-500">
        <div className="relative w-full h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-800/30 to-cyan-900/30 shadow-lg border border-cyan-400/20 backdrop-blur-sm">
          <img
            src={gameData.image_url}
            alt="Match this image"
            className="absolute inset-0 w-full h-full object-contain object-center p-4"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full flex-col items-center justify-center">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-cyan-300 text-lg font-medium">Image not available</p>
          </div>
        </div>
      </div>
      
      {/* Options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {gameData.options?.map((option, index) => (
          <div
            key={index}
            className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${index * 80}ms` }}
          >
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
      
      {/* Feedback section */}
      {feedback && (
        <div className="text-center animate-in slide-in-from-bottom-3 duration-500">
          <div className={`inline-block p-3 rounded-lg backdrop-blur-sm border text-lg font-bold mb-4 ${
            feedback.includes('Correct')
              ? 'text-green-300 bg-green-900/30 border-green-400/30'
              : 'text-red-300 bg-red-900/30 border-red-400/30'
          }`}>
            <div className="flex items-center gap-3">
              {lastResult === 'correct' && (
                <img
                  src={`${SUPABASE_BUCKET_URL}/happy_gecko.png`}
                  alt="happy gecko"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {lastResult === 'wrong' && (
                <img
                  src={`${SUPABASE_BUCKET_URL}/sad_gecko.png`}
                  alt="sad gecko"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span>{feedback}</span>
            </div>
          </div>
          
          {feedback !== '🎉 Correct!' && !isMixedRush && (
            <div>
              <button
                onClick={handleNextQuestion}
                className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30 backdrop-blur-sm"
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

export default ImageMatchGame;

