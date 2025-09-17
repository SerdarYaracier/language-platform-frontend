import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import ImageMatchGame from '../components/games/ImageMatchGame';
import FillInTheBlankGame from '../components/games/FillInTheBlankGame';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

const GamePage = () => {
  // URL'den artık level'ı da alıyoruz
  const { gameSlug, categorySlug, level } = useParams();
  const navigate = useNavigate();
  const { targetLang } = useContext(LanguageContext);
  const auth = useAuth();
  const user = auth?.user ?? null;

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const checkUnlock = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch levels for this category
        const resp = await api.get(`/api/games/${gameSlug}/${categorySlug}/levels`, {
          params: { lang: targetLang }
        });
        const levels = Array.isArray(resp.data) ? resp.data : [];
        const lvlNum = parseInt(level, 10) || 1;
        const entry = levels.find((l) => Number(l.level) === lvlNum);
        const isUnlocked = entry ? !!entry.is_unlocked : false;
        if (mounted) {
          setAllowed(isUnlocked);
          if (!isUnlocked) {
            setError('This level is locked.');
          }
        }
      } catch (err) {
        console.error('Failed to verify level unlock status', err);
        if (mounted) {
          // If 401, user might not be authenticated -> redirect to levels page
          if (err?.response?.status === 401) {
            navigate(`/levels/${gameSlug}/${categorySlug}`);
            return;
          }
          setError('Could not verify level unlock status.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // If there's no logged-in user, redirect to levels list (they must sign in first)
    if (!user) {
      navigate(`/levels/${gameSlug}/${categorySlug}`);
      return () => { mounted = false; };
    }

    checkUnlock();
    return () => { mounted = false; };
  }, [gameSlug, categorySlug, level, navigate, user, targetLang]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!allowed) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-red-900/20 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Level Locked</h2>
        <p className="mb-6">{error || 'You cannot access this level yet.'}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-cyan-600 rounded">Go back</button>
      </div>
    </div>
  );

  // Her oyuna artık categorySlug ve level'ı bir prop olarak iletiyoruz
  switch (gameSlug) {
    case 'sentence-scramble':
      return <SentenceScrambleGame categorySlug={categorySlug} level={level} />;
    case 'image-match':
      return <ImageMatchGame categorySlug={categorySlug} level={level} />;
    case 'fill-in-the-blank':
      return <FillInTheBlankGame categorySlug={categorySlug} level={level} />;
    default:
      return <p>Game not found!</p>;
  }
};

export default GamePage;