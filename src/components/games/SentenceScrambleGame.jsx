import React, { useState, useEffect, useContext, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LanguageContext } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;
// Supabase public bucket for decorative assets (gecko icons)
const SUPABASE_BUCKET_URL = 'https://vtwqtsjhobbiyvzdnass.supabase.co/storage/v1/object/public/stuffs';

// 🟢 Kelime componenti
const Word = memo(({ word, containerId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: word.id,
    data: { containerId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? '0px 8px 20px rgba(34, 197, 94, 0.3)' : 'none',
    zIndex: isDragging ? 10 : 'auto'
  };

  const baseClasses = 'p-3 px-5 rounded-lg text-lg cursor-grab select-none font-medium transition-all duration-200 transform hover:scale-105 border';
  const colorClasses = word.inSentence 
    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-cyan-400/30 shadow-lg' 
    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-100 border-gray-500/30 hover:from-gray-500 hover:to-gray-600 shadow-md';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${baseClasses} ${colorClasses}`}
    >
      {word.content}
    </div>
  );
});

// 🟢 Droppable container componenti
const DroppableArea = ({ id, words, title }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { containerId: id }
  });

  const baseClasses = 'min-h-[100px] rounded-xl p-4 mb-6 flex flex-wrap items-start gap-3 transition-all duration-300 border-2 backdrop-blur-sm';
  const colorClasses = id === 'userSentence' 
    ? `bg-gradient-to-br from-cyan-800/30 to-cyan-900/30 border-cyan-400/40 ${isOver ? 'border-cyan-300 bg-cyan-800/50' : ''}` 
    : `bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600/40 ${isOver ? 'border-gray-400 bg-gray-700/50' : ''}`;

  return (
    <div className="animate-in fade-in-50 duration-500">
      <h3 className="text-sm text-cyan-200 mb-3 font-semibold uppercase tracking-wider">{title}</h3>
      <div ref={setNodeRef} className={`${baseClasses} ${colorClasses}`}>
        <SortableContext
          id={id}
          items={words.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          {words.map((word, index) => (
            <div 
              key={word.id} 
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Word word={word} containerId={id} />
            </div>
          ))}
        </SortableContext>
        {words.length === 0 && (
          <div className="text-gray-400 text-center w-full py-4 italic">
            {id === 'userSentence' ? 'Drop words here to build your sentence' : 'All words used'}
          </div>
        )}
      </div>
    </div>
  );
};

// 🟢 Ana oyun componenti
const SentenceScrambleGame = ({ categorySlug, level, initialData, onCorrectAnswer, onWrongAnswer, isMixedRush, isDuelMode = false }) => {
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const { refreshProfile } = useAuth();
  const [containers, setContainers] = useState({
    wordBank: [],
    userSentence: []
  });
  const [activeWord, setActiveWord] = useState(null);
  const [correctSentence, setCorrectSentence] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [seenQuestionIds, setSeenQuestionIds] = useState([]);
  const seenQuestionIdsRef = useRef([]);
  const nextTimeoutRef = useRef(null);

  // seenQuestionIds değiştiğinde ref'i güncelle
  useEffect(() => {
    seenQuestionIdsRef.current = seenQuestionIds;
  }, [seenQuestionIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const fetchGame = async () => {
    // clear any pending auto-next timeout when fetching a new question
    if (nextTimeoutRef.current) {
      clearTimeout(nextTimeoutRef.current);
      nextTimeoutRef.current = null;
    }

    // MixedRush bu mantığı kullanmaz, çünkü sorular dışarıdan gelir.
    if (isMixedRush) {
      if(initialData) {
        const wordsWithIds = initialData.shuffled_words.map((word, index) => ({
          id: `word-${index}-${Date.now()}`,
          content: word,
          inSentence: false
        }));
        setContainers({ wordBank: wordsWithIds, userSentence: [] });
        setCorrectSentence(initialData.correct_sentence);
        setIsLoading(false);
      }
      return;
    }
    
    // Normal modda, kategori ve seviye bilgisi zorunludur.
    if (!categorySlug || !level) {
      navigate(`/categories/sentence-scramble`);
      return;
    }

    setIsLoading(true);
    setContainers({ wordBank: [], userSentence: [] });
    setFeedback('');

    // Current seen IDs'i ref'ten al (güncel değer)
    const currentSeenIds = seenQuestionIdsRef.current;
    const seenIdsParam = currentSeenIds.join(',');
    const lang = targetLang || 'en';
    
    console.log(`[SentenceScramble] Fetching game - seen IDs: [${seenIdsParam}], total seen: ${currentSeenIds.length}`);
    
    const url = `/api/games/sentence-scramble?lang=${lang}&category=${categorySlug}&level=${level}&seen_ids=${seenIdsParam}`;
    
    try {
      const response = await api.get(url);

      console.log(`[SentenceScramble] Backend response:`, response.data);

      // Backend boş nesne döndürürse tüm sorular bitmiş
      if (!response.data || Object.keys(response.data).length === 0) {
        console.log(`[SentenceScramble] No more questions available - level complete`);
        setFeedback("Congratulations! You've completed all questions in this level.");
        setIsLoading(false);
        return;
      }
      
      const wordsWithIds = response.data.shuffled_words.map((word, index) => ({
        id: `word-${index}-${Date.now()}`,
        content: word,
        inSentence: false
      }));
      setContainers({ wordBank: wordsWithIds, userSentence: [] });
      setCorrectSentence(response.data.correct_sentence);
      
      // Gelen yeni sorunun ID'sini görülenler listesine ekle
      if (response.data.id) {
        console.log(`[SentenceScramble] Adding question ID ${response.data.id} to seen list`);
        setSeenQuestionIds(prevIds => {
          const newIds = [...prevIds, response.data.id];
          console.log(`[SentenceScramble] Updated seen IDs: [${newIds.join(',')}]`);
          return newIds;
        });
      }

    } catch (err) {
      console.error(`[SentenceScramble] Error fetching game:`, err);
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
        const wordsWithIds = initialData.shuffled_words.map((word, index) => ({
          id: `word-${index}-${Date.now()}`,
          content: word,
          inSentence: false
        }));
        setContainers({ wordBank: wordsWithIds, userSentence: [] });
        setCorrectSentence(initialData.correct_sentence);
        setIsLoading(false);
      }
      return;
    }
    
    if (!categorySlug || !level) {
      navigate(`/categories/sentence-scramble`);
      return;
    }

    setIsLoading(true);
    const lang = targetLang || 'en';
    const url = `/api/games/sentence-scramble?lang=${lang}&category=${categorySlug}&level=${level}&seen_ids=`;
    
    try {
      const response = await api.get(url);
      console.log(`[SentenceScramble] Initial game loaded:`, response.data);

      if (!response.data || Object.keys(response.data).length === 0) {
        setFeedback("No questions available for this level.");
        setIsLoading(false);
        return;
      }
      
      const wordsWithIds = response.data.shuffled_words.map((word, index) => ({
        id: `word-${index}-${Date.now()}`,
        content: word,
        inSentence: false
      }));
      setContainers({ wordBank: wordsWithIds, userSentence: [] });
      setCorrectSentence(response.data.correct_sentence);
      
      // İlk sorunun ID'sini kaydet
      if (response.data.id) {
        console.log(`[SentenceScramble] Initial question ID: ${response.data.id}`);
        setSeenQuestionIds([response.data.id]);
      }

    } catch (err) {
      console.error(`[SentenceScramble] Error loading initial game:`, err);
      setFeedback('Could not load the game.');
    } finally {
      setIsLoading(false);
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
    // reset transient state when level/category changes
    setFeedback('');
    setContainers({ wordBank: [], userSentence: [] });
    setIsLoading(true);
    setSeenQuestionIds([]);

    if (initialData) {
      const wordsWithIds = initialData.shuffled_words.map((word, index) => ({
        id: `word-${index}-${Date.now()}`,
        content: word,
        inSentence: false
      }));
      setContainers({ wordBank: wordsWithIds, userSentence: [] });
      setCorrectSentence(initialData.correct_sentence);
      setIsLoading(false);
      // İlk veri için de ID'yi kaydet
      if (initialData.id) {
        console.log(`[SentenceScramble] Initial data ID: ${initialData.id}`);
        setSeenQuestionIds([initialData.id]);
      }
    } else {
      loadInitialGame(); // İlk yükleme için özel fonksiyon kullan
    }
  }, [initialData, targetLang, categorySlug, level, isMixedRush]);

  const handleDragStart = event => {
    const { active } = event;
    const containerId = active.data.current.sortable.containerId;
    setActiveWord(containers[containerId].find(item => item.id === active.id));
  };

  const handleDragEnd = event => {
    const { active, over } = event;
    setActiveWord(null);

    if (!over) return;

    const activeContainer = active.data.current.sortable.containerId;
    const overContainer = over.data.current?.containerId;

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      if (active.id !== over.id) {
        setContainers(prev => {
          const containerItems = prev[activeContainer];
          const oldIndex = containerItems.findIndex(item => item.id === active.id);
          const newIndex = containerItems.findIndex(item => item.id === over.id);
          return {
            ...prev,
            [activeContainer]: arrayMove(containerItems, oldIndex, newIndex)
          };
        });
      }
    } else {
      setContainers(prev => {
        const sourceItems = [...prev[activeContainer]];
        const destinationItems = [...prev[overContainer]];
        const activeIndex = sourceItems.findIndex(item => item.id === active.id);
        const [movedItem] = sourceItems.splice(activeIndex, 1);
        movedItem.inSentence = overContainer === 'userSentence';

        const overIndex = destinationItems.findIndex(item => item.id === over.id);
        const newIndex = overIndex !== -1 ? overIndex : destinationItems.length;
        destinationItems.splice(newIndex, 0, movedItem);

        return {
          ...prev,
          [activeContainer]: sourceItems,
          [overContainer]: destinationItems
        };
      });
    }
  };

  const submitScore = async () => {
    if (isMixedRush) return;
    
    // Calculate points based on level: 1→5, 2→7, 3→10, 4→15, 5→17
    const getPointsForLevel = (lvl) => {
      const levelNum = parseInt(lvl) || 1;
      const pointsMap = { 1: 5, 2: 7, 3: 10, 4: 15, 5: 17 };
      return pointsMap[levelNum] || 5; // fallback to 5 points for unknown levels
    };
    
    try {
      await api.post('/api/progress/submit-score', {
        gameSlug: 'sentence-scramble',
        categorySlug: categorySlug,
        level: level,
        points: getPointsForLevel(level), // Send calculated points
        lang: targetLang, // Include target language for proper progress tracking
      });
      console.log('Score submitted for sentence-scramble');
      if (typeof refreshProfile === 'function') refreshProfile();
    } catch (error) {
      console.error('Failed to submit score', error);
    }
  };

  const checkAnswer = () => {
    const userSentence = containers.userSentence.map(w => w.content).join(' ');
    if (userSentence === correctSentence) {
      // show short success token first; fetchGame may replace with level-complete message
      setFeedback('Correct!');
      if (typeof onCorrectAnswer === 'function') {
        setTimeout(onCorrectAnswer, 300);
      } else if (!isDuelMode) {
        // only auto-submit/advance when NOT in duel mode
        submitScore();
        setTimeout(() => {
          fetchGame();
        }, 1500);
      }
    } else {
      setFeedback('Wrong!');
      
      // MixedRush veya DuelMode'da yanlış cevap için özel işlem
      if ((isMixedRush || isDuelMode) && typeof onWrongAnswer === 'function') {
        setTimeout(onWrongAnswer, 300);
      }
      // Normal modda kullanıcı tekrar deneyebilir
    }
  };

  const handleNextQuestion = () => {
    fetchGame();
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-8 rounded-2xl w-full max-w-md mx-auto text-center border border-cyan-400/30 animate-pulse">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <div className="text-xl text-cyan-200">Loading Game...</div>
      </div>
    );
  }

  // Level/kategori bittiğinde gösterilecek özel durum
  if (!containers.wordBank.length && !containers.userSentence.length && feedback.includes("Congratulations")) {
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm p-8 rounded-2xl w-full max-w-md mx-auto text-center border border-cyan-400/30 animate-in zoom-in-95 duration-500">
        <div className="mb-4 animate-bounce">
          <img
            src={`${SUPABASE_BUCKET_URL}/clap_gecko.png`}
            alt="clap gecko"
            className="w-20 h-20 mx-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <h2 className="text-2xl text-cyan-300 font-bold mb-4">Level Complete!</h2>
        <p className="text-cyan-100 mb-6">{feedback}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigate(`/levels/sentence-scramble/${categorySlug}`)}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-cyan-400/30"
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
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-400/30"
          >
            Retry Level
          </button>
          {level < 5 && (
            <button
              onClick={() => navigate(`/game/sentence-scramble/${categorySlug}/${parseInt(level) + 1}`)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-green-400/30"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!containers.wordBank.length && !containers.userSentence.length) {
    return (
      <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm p-6 rounded-2xl w-full max-w-md mx-auto text-center border border-red-400/30">
        <div className="text-xl text-red-300">{feedback || 'No game data.'}</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur-sm p-8 rounded-2xl w-full max-w-4xl mx-auto border border-cyan-400/30 shadow-2xl animate-in fade-in-50 duration-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl text-cyan-300 font-bold mb-2 bg-gradient-to-r from-cyan-300 to-cyan-100 bg-clip-text text-transparent">
            Build the Sentence
          </h2>
          <p className="text-cyan-200/80 mb-4 text-lg">
            Drag the words to form a correct sentence.
          </p>
          
          {/* Progress indicator */}
          <div className="bg-cyan-900/30 rounded-full p-3 mb-6 inline-block border border-cyan-400/20">
            <div className="text-sm text-cyan-200 font-medium">
              Question {seenQuestionIds.length} of 5
            </div>
            <div className="w-32 bg-cyan-900/50 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(seenQuestionIds.length / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <DroppableArea
          id="userSentence"
          title="Your Sentence"
          words={containers.userSentence}
        />
        <DroppableArea
          id="wordBank"
          title="Word Bank"
          words={containers.wordBank}
        />

        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={checkAnswer}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-green-400/30 backdrop-blur-sm text-lg"
          >
            Check Answer
          </button>
        </div>

        {feedback && (
          <div className={`mt-6 text-center animate-in slide-in-from-bottom-3 duration-500`}>
            { (feedback === 'Correct!' || feedback === 'Wrong!') ? (
              <div className={`inline-flex items-center gap-3 p-3 rounded-lg backdrop-blur-sm border text-xl font-bold mb-3 ${
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
            ) : (
              <div className={`inline-block p-4 rounded-lg backdrop-blur-sm border text-xl font-bold ${
                feedback.includes('Congratulations') ? 'text-green-300 bg-green-900/30 border-green-400/30' : 'text-red-300 bg-red-900/30 border-red-400/30'
              }`}>
                {feedback}
              </div>
            )}
          </div>
         )}
      </div>

      <DragOverlay>
        {activeWord ? (
          <div className="transform rotate-3 scale-110">
            <Word
              word={activeWord}
              containerId={activeWord.inSentence ? 'userSentence' : 'wordBank'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SentenceScrambleGame;
