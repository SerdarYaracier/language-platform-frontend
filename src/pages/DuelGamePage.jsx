// frontend/src/pages/DuelGamePage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import ImageMatchGame from '../components/games/ImageMatchGame';
import FillInTheBlankGame from '../components/games/FillInTheBlankGame';
// Eğer QuizGame'iniz varsa ekleyin
// import QuizGame from '../components/games/QuizGame'; 
import LoadingSpinner from '../components/LoadingSpinner';

const GAME_DURATION = 75; // Saniye
const POINTS_MAP = { 1: 5, 2: 7, 3: 10, 4: 15, 5: 17, 0: 10 }; // Level bazlı puanlar (0=ALL için varsayılan)

// Backend'den gelen game_type_id'lerini component'lere eşleştirmek için bir harita
// BU KISMI KENDİ game_types tablonuzdaki INT ID'lere ve corresponding Component'lere göre DÜZENLEYİN.
const GAME_TYPE_COMPONENTS = {
  1: SentenceScrambleGame, // Sentence Scramble'ın ID'si 1 ise
  2: ImageMatchGame,      // Image Match'ın ID'si 2 ise
  3: FillInTheBlankGame,  // Fill In The Blank'ın ID'si 3 ise
  // 4: QuizGame,             // QuizGame'inizin ID'si 4 ise (varsa)
  "default": () => <div className="text-red-400 text-center text-lg">Unknown Game Type. Please contact support.</div> 
};

const DuelGamePage = () => {
  const { user, refreshProfile } = useAuth();
  const { duelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const challengedIdParam = searchParams.get('challenged_id');
  const difficultyParam = searchParams.get('difficulty');
  const isChallengerMode = !duelId && challengedIdParam && difficultyParam !== null;

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);

  const scoreRef = useRef(score);
  const timerRef = useRef(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const fetchDuelData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let response;
      if (isChallengerMode) {
        const difficulty = parseInt(difficultyParam);
        if (isNaN(difficulty) || difficulty < 0 || difficulty > 5) {
          throw new Error("Invalid difficulty level provided in URL.");
        }
        // Backend'e difficulty_level'i int olarak gönderiyoruz
        response = await api.post('/api/duel/generate-questions', { difficulty_level: difficulty });
        console.log('[DuelGamePage] generate-questions response:', response.data);
        // defensive: some backends return questions directly or as {questions: [...]}
        const q = response.data?.questions ?? response.data ?? [];
        console.log('[DuelGamePage] extracted questions:', q);
        
        // CHALLENGER - Soru ID'lerini logla
        const challengerQuestionIds = q.map((question, index) => {
          const id = question.duel_question_id || question.game_item?.id || question.game_item?.game_item_id || question.id;
          const gameType = question.game_item?.game_type_id || question.game_type_id;
          return `${index+1}. ID:${id} Type:${gameType}`;
        });
        console.log('[CHALLENGER QUESTIONS]:', challengerQuestionIds);
        
        setQuestions(q);
      } else if (duelId) {
        response = await api.get(`/api/duel/duel-questions/${duelId}`);
        console.log('[DuelGamePage] duel-questions response:', response.data);
        const q = response.data?.questions ?? response.data ?? [];
        console.log('[DuelGamePage] extracted questions:', q);
        
        // CHALLENGED - Soru ID'lerini logla
        const challengedQuestionIds = q.map((question, index) => {
          const id = question.duel_question_id || question.game_item?.id || question.game_item?.game_item_id || question.id;
          const gameType = question.game_item?.game_type_id || question.game_type_id;
          return `${index+1}. ID:${id} Type:${gameType}`;
        });
        console.log('[CHALLENGED QUESTIONS]:', challengedQuestionIds);
        
        setQuestions(q);
      } else {
        throw new Error("Invalid duel state: No duel ID or challenge parameters found.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch duel data.';
      setError(errorMessage);
      console.error("Duel data fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [duelId, isChallengerMode, difficultyParam]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDuelData();
  }, [user, navigate, fetchDuelData]);

  useEffect(() => {
    if (isLoading || isGameOver || questions.length === 0 || !isGameStarted) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      setIsGameOver(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isLoading, isGameOver, questions.length, isGameStarted]);

  useEffect(() => {
    if (isGameOver && isGameStarted) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const submitResult = async () => {
        try {
          const finalScore = scoreRef.current;
          const finalTimeTaken = GAME_DURATION - timeLeft;
          const answers = [];

          if (isChallengerMode) {
            const createDuelResponse = await api.post('/api/duel/create-duel', {
              challenged_id: challengedIdParam,
              difficulty_level: parseInt(difficultyParam),
              challenger_score: finalScore,
              challenger_time_taken: finalTimeTaken,
              challenger_answers: answers,
              questions: questions  // SORULARI DA GÖNDERİYORUZ!
            });
            console.log("Challenger duel created:", createDuelResponse.data);
            console.log("Questions sent to backend:", questions.length, "questions");
          } else if (duelId) {
            const submitDuelResponse = await api.post(`/api/duel/submit-duel-result/${duelId}`, {
              score: finalScore,
              time_taken: finalTimeTaken,
              answers: answers
            });
            console.log("Challenged duel submitted:", submitDuelResponse.data);
          }
          refreshProfile();
          navigate('/duels');
        } catch (err) {
          const errorMessage = err.response?.data?.error || err.message || 'Failed to submit duel result.';
          setError(errorMessage);
          console.error("Duel result submission failed:", err);
        }
      };
      submitResult();
    }
  }, [isGameOver, isGameStarted, isChallengerMode, challengedIdParam, difficultyParam, duelId, timeLeft, refreshProfile, navigate]);

  const handleCorrectAnswer = useCallback(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      // Support both shapes: { game_item: { level, ... } } or flat { level, ... }
      const level = currentQuestion.game_item?.level ?? currentQuestion.level ?? 0;
      const points = POINTS_MAP[level] || POINTS_MAP[0];
      setScore(prev => prev + points);
    }

    console.log('[DuelGamePage] handleCorrectAnswer called for index:', currentQuestionIndex);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        console.log('[DuelGamePage] advancing index from', prev, 'to', prev + 1);
        return prev + 1;
      });
    } else {
      setIsGameOver(true);
    }
  }, [questions, currentQuestionIndex]);

  const handleWrongAnswer = useCallback(() => {
    console.log('[DuelGamePage] handleWrongAnswer called for index:', currentQuestionIndex);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        console.log('[DuelGamePage] advancing index from', prev, 'to', prev + 1);
        return prev + 1;
      });
    } else {
      setIsGameOver(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // Log index changes
  useEffect(() => {
    if (questions.length === 0) return;
    const current = questions[currentQuestionIndex];
    console.log('[DuelGamePage] currentQuestionIndex changed:', currentQuestionIndex, 'currentQuestion:', current && (current.duel_question_id || current.game_item?.id || current.game_item?.game_item_id || current.id));
  }, [currentQuestionIndex, questions]);

  const currentGameComponent = useMemo(() => {
    if (questions.length === 0) return <div className="text-gray-400 text-center">No questions loaded for this duel.</div>;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      return <div className="text-red-400 text-center">Invalid question data at current index.</div>;
    }

    // Accept two shapes:
    // 1) { game_item: { game_type_id, content, ... }, ... }
    // 2) { game_type_id, content, ... }
    const wrapper = currentQuestion.game_item ? currentQuestion.game_item : currentQuestion;
    if (!wrapper || !wrapper.content) {
      console.warn('[DuelGamePage] currentQuestion wrapper missing content:', currentQuestion);
      return <div className="text-red-400 text-center">Invalid question data at current index.</div>;
    }

    const { game_type_id, content } = wrapper;

    // game_type_id'nin int olduğunu varsayarak doğrudan kullanıyoruz.
    const GameComponent = GAME_TYPE_COMPONENTS[game_type_id] || GAME_TYPE_COMPONENTS["default"];

    // Your DB stores question payload in `content` (jsonb). Support stringified JSON or object.
  const gameSpecificData = typeof content === 'string' ? JSON.parse(content) : content;

  console.log('[DuelGamePage] question shape used:', currentQuestion.game_item ? 'nested.game_item' : 'flat');

    console.log('[DuelGamePage] Rendering question index:', currentQuestionIndex);
    console.log('[DuelGamePage] currentQuestion:', currentQuestion);
    console.log('[DuelGamePage] content:', content);
    console.log('[DuelGamePage] gameSpecificData:', gameSpecificData);
    console.log('[DuelGamePage] game_type_id:', game_type_id);

    // DuelGamePage için data'yı MixedRush gibi düzleştir - user'ın target language'ine göre
    const userLang = user?.target_language || 'en'; // varsayılan İngilizce
    
    const flattenedData = {
      ...gameSpecificData,
      // Multi-language alanları düzleştir
      options: gameSpecificData.options?.[userLang] || gameSpecificData.options,
      answer: gameSpecificData.answer?.[userLang] || gameSpecificData.answer,
      // Diğer alanlar olduğu gibi kalsın
      image_url: gameSpecificData.image_url,
      shuffled_words: gameSpecificData.shuffled_words?.[userLang] || gameSpecificData.shuffled_words,
      sentence_parts: gameSpecificData.sentence_parts?.[userLang] || gameSpecificData.sentence_parts,
    };

    // SentenceScramble için özel durum: Eğer shuffled_words yoksa ve cümle varsa, cümleyi kelimelere böl
    if (game_type_id === 1 && !flattenedData.shuffled_words && gameSpecificData[userLang]) {
      const sentence = gameSpecificData[userLang];
      const words = sentence.split(' ').filter(word => word.trim().length > 0);
      // Karıştır
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      
      flattenedData.shuffled_words = shuffled;
      flattenedData.correct_sentence = sentence;
      
      console.log('[DuelGamePage] Generated shuffled_words for SentenceScramble:', shuffled);
      console.log('[DuelGamePage] correct_sentence:', sentence);
    }

    console.log('[DuelGamePage] userLang:', userLang);
    console.log('[DuelGamePage] flattenedData:', flattenedData);

    return (
      <GameComponent
        initialData={flattenedData}
        onCorrectAnswer={handleCorrectAnswer}
        onWrongAnswer={handleWrongAnswer}
        isDuelMode={true}
      />
    );
  }, [questions, currentQuestionIndex, user?.target_language, handleCorrectAnswer, handleWrongAnswer]);

  const renderCurrentGame = () => {
    return currentGameComponent;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center mt-8 text-2xl font-bold">{error}</div>;

  if (!isGameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-6">Duel Ready!</h1>
        <p className="text-xl mb-4">You have {GAME_DURATION} seconds to answer 20 questions.</p>
        <p className="text-lg mb-8">Beat your opponent's score!</p>
        <button
          onClick={() => setIsGameStarted(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl transition-all duration-300"
        >
          START DUEL
        </button>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-6">Duel Over!</h1>
        <p className="text-2xl mb-4">Your Score: <span className="text-cyan-400">{score}</span></p>
        <p className="text-xl mb-8">Time Spent: {GAME_DURATION - timeLeft} seconds</p>
        <button
          onClick={() => navigate('/duels')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-all duration-300"
        >
          Go to Duels List
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-6 mt-8">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-3xl font-bold text-red-400">DUEL!</h2>
          <div className="text-xl">
            <span className="font-semibold">Time:</span> <span className="text-yellow-400">{timeLeft}s</span> |
            <span className="font-semibold ml-4">Score:</span> <span className="text-green-400">{score}</span>
          </div>
        </div>

        <div className="game-area">
          {renderCurrentGame()}
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          Question {currentQuestionIndex + 1} / {questions.length}
        </div>
      </div>
    </div>
  );
};

export default DuelGamePage;