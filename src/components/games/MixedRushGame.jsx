import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';

// Yönetilecek oyun bileşenlerini import ediyoruz
import SentenceScrambleGame from './SentenceScrambleGame';
import ImageMatchGame from './ImageMatchGame';
import FillInTheBlankGame from './FillInTheBlankGame';

const GAME_DURATION = 75; // Saniye cinsinden oyun süresi

const MixedRushGame = () => {
  const { user, refreshProfile } = useAuth();
  const { targetLang } = useContext(LanguageContext);
  
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Puan haritası
  const POINTS_MAP = { 1: 5, 2: 7, 3: 10, 4: 15, 5: 17 };

  // useRef, zamanlayıcı bittiğinde skorun GÜNCEL değerine ulaşmak için gereklidir.
  const scoreRef = useRef(score);

  // score state'i her değiştiğinde, ref'in de değerini güncelliyoruz.
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Bir sonraki rastgele soruyu getiren fonksiyon
  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/games/mixed-rush/random-question?lang=${targetLang}`);
      setCurrentQuestion({
        type: response.data.type,
        data: response.data.data,
        level: response.data.level
      });
    } catch (error) {
      console.error(`Failed to fetch data for Mixed Rush`, error);
    } finally {
      setIsLoading(false);
    }
  }, [targetLang]);

  // Oyun bitiminde skoru kaydeden fonksiyon
  const submitFinalScore = useCallback(async () => {
    if (!user) return;
    try {
      // Skoru doğrudan en güncel değeri tutan scoreRef'ten alıyoruz
      await api.post('/api/progress/submit-mixed-rush-score', {
        score: scoreRef.current 
      });
      console.log('Mixed Rush final score submitted:', scoreRef.current);
      if (refreshProfile) {
        refreshProfile();
      }
    } catch (error) {
      console.error('Failed to submit Mixed Rush score', error);
    }
  }, [user, refreshProfile]);

  // Zamanlayıcıyı ve oyun akışını yöneten TEK useEffect
  useEffect(() => {
    // Oyun bittiyse zamanlayıcıyı çalıştırma
    if (isGameOver) return;

    // Oyun ilk başladığında soruyu getir
    if (timeLeft === GAME_DURATION) {
      fetchNextQuestion();
    }

    // Zamanlayıcıyı çalıştır
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } 
    // Süre bittiğinde
    else {
      setIsGameOver(true);
      setCurrentQuestion(null); // Aktif soruyu temizle
      submitFinalScore(); // Skoru gönder
    }
  }, [timeLeft, isGameOver, fetchNextQuestion, submitFinalScore]);

  // Doğru cevap verildiğinde tetiklenecek fonksiyon
  const handleCorrectAnswer = () => {
    console.clear(); // Her seferinde konsolu temizle
    console.log("--- handleCorrectAnswer triggered! ---");

    // 1. O anki sorunun ne olduğunu görelim
    console.log("Current Question Object:", currentQuestion);

    // 2. Sorunun seviyesini bulmaya çalışalım
    const level = currentQuestion?.level;
    console.log("Level found:", level);

    // 3. Puan haritasından bu seviyenin karşılığını bulalım
    const points = POINTS_MAP[level] || 0;
    console.log(`Points calculated: ${points} (from level ${level})`);

    // 4. Mevcut skoru ve yeni skoru görelim
    console.log("Score before update:", score);
    const newScore = score + points;
    console.log("Score after update will be:", newScore);
    
    setScore(newScore);
    fetchNextQuestion();
  };

  // Oyunu yeniden başlatan fonksiyon
  const handlePlayAgain = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsGameOver(false);
    setIsLoading(true);
    // useEffect, timeLeft değiştiği için oyunu otomatik başlatacak
  };

  // Ekrana hangi oyunun çizileceğini belirleyen fonksiyon
  const renderCurrentGame = () => {
    if (isLoading || !currentQuestion) {
      return <div className="text-center text-xl">Loading Next Question...</div>;
    }
    const gameProps = {
      initialData: currentQuestion.data,
      onCorrectAnswer: handleCorrectAnswer,
      isMixedRush: true,
      level: currentQuestion.level
    };
    switch (currentQuestion.type) {
      case 'sentence-scramble':
        return <SentenceScrambleGame {...gameProps} />;
      case 'image-match':
        return <ImageMatchGame {...gameProps} />;
      case 'fill-in-the-blank':
        return <FillInTheBlankGame {...gameProps} />;
      default:
        return <p>Error: Unknown game type.</p>;
    }
  };

  // Oyun bittiğinde gösterilecek ekran
  if (isGameOver) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md mx-auto text-center">
        <h2 className="text-4xl text-red-500 font-bold mb-4">Time's Up!</h2>
        <p className="text-2xl mb-6">Your final score is:</p>
        {/* 'score' state'ini değil, her zaman en güncel olan ref'i göster */}
        <p className="text-6xl font-bold text-yellow-400 mb-8">{scoreRef.current}</p>
        <button
          onClick={handlePlayAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  // Oyun devam ederken gösterilecek ekran
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 bg-gray-900 p-4 rounded-lg">
        <div className="text-2xl font-bold">
          Score: <span className="text-yellow-400">{score}</span>
        </div>
        <div className="text-2xl font-bold">
          Time: <span className="text-red-500">{timeLeft}s</span>
        </div>
      </div>
      <div className="mt-4">
        {renderCurrentGame()}
      </div>
    </div>
  );
};

export default MixedRushGame;