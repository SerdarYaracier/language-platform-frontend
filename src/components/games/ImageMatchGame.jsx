import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LanguageContext } from '../../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ImageMatchGame = ({ initialData, onCorrectAnswer }) => {
  const { targetLang } = useContext(LanguageContext);
  const [gameData, setGameData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState(null);

  const GAME_KEY = 'seenIds:image-match';
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
        const response = await axios.get(`${API_URL}/api/games/image-match?lang=${targetLang}`);
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

  useEffect(() => {
    fetchGame();
  }, [targetLang]);

  const handleOptionClick = (option) => {
    if (feedback) return; // Eğer cevap zaten verildiyse tekrar tıklamayı engelle

    setSelectedOption(option);
    if (option === gameData.answer) {
      setFeedback('Correct!');
      if (currentGameId) addSeen(GAME_KEY, currentGameId);
      if (typeof onCorrectAnswer === 'function') {
        onCorrectAnswer();
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
      return 'bg-green-600'; // Doğru cevap her zaman yeşil
    }
    if (option === selectedOption && option !== gameData.answer) {
      return 'bg-red-600'; // Seçilen yanlış cevap kırmızı
    }
    return 'bg-gray-700 opacity-50'; // Diğer yanlış seçenekler soluk
  };

  if (isLoading) {
    return <div className="text-center text-xl">Loading Game...</div>;
  }

  if (!gameData) {
    return <div className="text-center text-xl text-red-400">{feedback}</div>;
  }

  const imageUrl = gameData.image_url || (gameData.content && gameData.content.image_url);
  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-auto text-center">
      <h2 className="text-2xl text-purple-400 font-bold mb-4">Match the Image</h2>
      <div className="mb-6">
        <img
          src={imageUrl}
          alt="Match this image"
          className="rounded-lg shadow-lg mx-auto w-[70%] h-[70%] object-cover"
        />
      </div>
  <div className="grid grid-cols-2 grid-rows-2 gap-1">
        {gameData.options && Array.isArray(gameData.options) && gameData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            disabled={!!feedback}
            className={`aspect-square flex items-center justify-center text-white font-bold text-base rounded transition duration-300 scale-90 ${getButtonClass(option)}`}
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
          <button
            onClick={fetchGame}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          >
            Next Question
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageMatchGame;
