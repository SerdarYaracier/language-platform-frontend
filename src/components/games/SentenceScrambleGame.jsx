import React, { useState, useEffect, useContext, memo } from 'react';
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
  const [currentGameId, setCurrentGameId] = useState(null);

  // localStorage helpers to avoid repeating questions a user already solved
  const GAME_KEY = 'seenIds:sentence-scramble';
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const fetchGame = async () => {
    setIsLoading(true);
    setFeedback('');
    setCurrentGameId(null);

  if (initialData) {
      const id = getGameId(initialData);
      if (isSeen(GAME_KEY, id)) {
        setFeedback('No new questions available.');
        setGameData(null);
        setIsLoading(false);
        return;
      }
      const wordsWithIds = initialData.shuffled_words.map((word, index) => ({
        id: `word-${index}-${Date.now()}`,
        content: word,
        inSentence: false
      }));
      setContainers({ wordBank: wordsWithIds, userSentence: [] });
      setCorrectSentence(initialData.correct_sentence);
      setCurrentGameId(id);
      setIsLoading(false);
      return;
    }

    // Try to fetch up to 5 times to find an unseen question
    let attempts = 5;
    // If we're running inside MixedRush, the parent provides initialData; don't fetch here
    if (isMixedRush) {
      setIsLoading(false);
      return;
    }

    while (attempts > 0) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const base = `${API_URL}/api/games/sentence-scramble?lang=${targetLang}&category=${encodeURIComponent(categorySlug || '')}`;
        const url = level ? `${base}&level=${encodeURIComponent(level)}` : base;
        const response = await api.get(url);
        const id = getGameId(response.data);
        if (id && isSeen(GAME_KEY, id)) {
          attempts -= 1;
          continue; // try again
        }

        const wordsWithIds = response.data.shuffled_words.map((word, index) => ({
          id: `word-${index}-${Date.now()}`,
          content: word,
          inSentence: false
        }));
        setContainers({ wordBank: wordsWithIds, userSentence: [] });
        setCorrectSentence(response.data.correct_sentence);
        setCurrentGameId(id);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Failed to fetch game data!', error);
        setFeedback('Could not load the game.');
        setIsLoading(false);
        return;
      }
    }

    // Out of attempts
    setFeedback('No new questions available.');
    setGameData(null);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGame();
  }, [targetLang, categorySlug, level]);

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
      if (currentGameId) addSeen(GAME_KEY, currentGameId);
      if (typeof onCorrectAnswer === 'function') {
        setTimeout(onCorrectAnswer, 1000);
      } else {
        submitScore();
      }
    } else {
      setFeedback('❌ Try again!');
    }
  };

  if (isLoading) {
    return <div className="text-center text-xl">Loading Game...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin} // ✅ boş konteynerde de çalışır
    >
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-3xl mx-auto">
        <h2 className="text-2xl text-cyan-400 font-bold mb-4 text-center">
          Build the Sentence
        </h2>
        <p className="text-center text-gray-400 mb-6">
          Drag the words to form a correct sentence.
        </p>

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
            onClick={fetchGame}
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
