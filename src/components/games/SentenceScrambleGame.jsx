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
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0px 5px 15px rgba(0,0,0,0.2)' : 'none',
    zIndex: isDragging ? 10 : 'auto'
  };

  const baseClasses = 'p-2 px-4 rounded text-lg cursor-grab select-none';
  const colorClasses = word.inSentence ? 'bg-cyan-600' : 'bg-gray-500';

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
  const { setNodeRef } = useDroppable({
    id,
    data: { containerId: id }
  });

  const baseClasses =
    'min-h-[80px] rounded p-3 mb-4 flex flex-wrap items-start gap-3 transition-colors';
  const colorClasses = id === 'userSentence' ? 'bg-gray-700' : 'bg-gray-900';

  return (
    <div>
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <div ref={setNodeRef} className={`${baseClasses} ${colorClasses}`}>
        <SortableContext
          id={id}
          items={words.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          {words.map(word => (
            <Word key={word.id} word={word} containerId={id} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// 🟢 Ana oyun componenti
const SentenceScrambleGame = ({ categorySlug, level, initialData, onCorrectAnswer, isMixedRush }) => {
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
    try {
      await api.post('/api/progress/submit-score', {
        gameSlug: 'sentence-scramble',
        categorySlug: categorySlug,
        level: level,
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
      setFeedback('🎉 Congratulations! Correct sentence!');
      if (typeof onCorrectAnswer === 'function') {
        setTimeout(onCorrectAnswer, 1500);
      } else {
        submitScore();
        setTimeout(() => {
          fetchGame();
        }, 1500);
      }
    } else {
      setFeedback('❌ Try again!');
    }
  };

  const handleNextQuestion = () => {
    fetchGame();
  };

  if (isLoading) {
    return <div className="text-center text-xl">Loading Game...</div>;
  }

  // Level/kategori bittiğinde gösterilecek özel durum
  if (!containers.wordBank.length && !containers.userSentence.length && feedback.includes("Congratulations")) {
    return (
        <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md mx-auto text-center">
            <h2 className="text-2xl text-green-400 font-bold mb-4">Level Complete!</h2>
            <p className="text-white mb-6">{feedback}</p>
            <div className="flex gap-4 justify-center">
              <button
                  onClick={() => navigate(`/levels/sentence-scramble/${categorySlug}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
              >
                  Back to Levels
              </button>
              {/* Retry butonu */}
              <button
                onClick={() => {
                  setSeenQuestionIds([]);
                  setFeedback('');
                  setIsLoading(true);
                  loadInitialGame();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded"
              >
                Retry Level
              </button>
              {level < 5 && (
                <button
                    onClick={() => navigate(`/game/sentence-scramble/${categorySlug}/${parseInt(level) + 1}`)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                >
                    Next Level
                </button>
              )}
            </div>
        </div>
    );
  }

  if (!containers.wordBank.length && !containers.userSentence.length) {
    return <div className="text-center text-xl text-red-400">{feedback || 'No game data.'}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-3xl mx-auto">
        <h2 className="text-2xl text-cyan-400 font-bold mb-4 text-center">
          Build the Sentence
        </h2>
        <p className="text-center text-gray-400 mb-6">
          Drag the words to form a correct sentence.
        </p>

        {/* Debug bilgisi */}
        <div className="text-xs text-gray-500 mb-4 text-center">
          Questions seen: {seenQuestionIds.length}/5
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

        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={checkAnswer}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
          >
            Check Answer
          </button>
          <button
            onClick={handleNextQuestion}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          >
            New Sentence
          </button>
        </div>

        {feedback && (
          <p
            className={`mt-4 text-center text-xl font-bold ${
              feedback.includes('Congratulations')
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {feedback}
          </p>
        )}
      </div>

      <DragOverlay>
        {activeWord ? (
          <Word
            word={activeWord}
            containerId={activeWord.inSentence ? 'userSentence' : 'wordBank'}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SentenceScrambleGame;
