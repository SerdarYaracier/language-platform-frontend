import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { LanguageContext } from '../../context/LanguageContext';

// Yönetilecek oyun bileşenlerini import ediyoruz
import SentenceScrambleGame from './SentenceScrambleGame';
import ImageMatchGame from './ImageMatchGame';
import FillInTheBlankGame from './FillInTheBlankGame';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const GAME_DURATION = 75; // Saniye cinsinden oyun süresi

const MixedRushGame = () => {
  const { targetLang } = useContext(LanguageContext);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Bir sonraki rastgele soruyu getiren fonksiyon GÜNCELLENDİ
  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Artık tek ve doğru endpoint'i çağırıyoruz
      const response = await axios.get(`${API_URL}/api/games/mixed-rush/random-question?lang=${targetLang}`);
      
      // Gelen veri zaten doğru formatta olduğu için direkt state'e set ediyoruz
      setCurrentQuestion({
        type: response.data.type,
        data: response.data.data
      });
    } catch (error) {
      console.error(`Failed to fetch data for Mixed Rush`, error);
      // Bir hata olursa, bir sonrakini denesin
      setTimeout(fetchNextQuestion, 1000);
    } finally {
      setIsLoading(false);
    }
  }, [targetLang]);

  // Zamanlayıcı için useEffect
  useEffect(() => {
    if (isGameOver) return;

    if (timeLeft === GAME_DURATION) {
        fetchNextQuestion(); // Oyun başladığında ilk soruyu getir
    }

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsGameOver(true);
      setCurrentQuestion(null); // Oyun bitince soruyu temizle
    }
  }, [timeLeft, isGameOver, fetchNextQuestion]);

  // Doğru cevap verildiğinde tetiklenecek fonksiyon
  const handleCorrectAnswer = () => {
    setScore(prev => prev + 1);
    fetchNextQuestion();
  };

  // Oyunu yeniden başlatan fonksiyon
  const handlePlayAgain = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsGameOver(false);
    setIsLoading(true);
    // fetchNextQuestion'ı direkt çağırmak yerine, useEffect'in tetiklemesini bekleyebiliriz.
    // Ancak daha hızlı başlaması için direkt çağırmak daha iyi bir kullanıcı deneyimi sunar.
    fetchNextQuestion();
  };

  // Ekrana hangi oyunun çizileceğini belirleyen fonksiyon
  const renderCurrentGame = () => {
    if (isLoading || !currentQuestion) {
      return <div className="text-center text-xl">Loading Next Question...</div>;
    }

    const gameProps = {
      initialData: currentQuestion.data,
      onCorrectAnswer: handleCorrectAnswer,
      isMixedRush: true // Bu prop, oyun bileşenlerinin kategori getirmeye çalışmasını engeller
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
        <p className="text-6xl font-bold text-yellow-400 mb-8">{score}</p>
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

