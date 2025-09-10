import React from 'react';
import { useParams } from 'react-router-dom';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import ImageMatchGame from '../components/games/ImageMatchGame';
import FillInTheBlankGame from '../components/games/FillInTheBlankGame';

const GamePage = () => {
  // URL'den artık level'ı da alıyoruz
  const { gameSlug, categorySlug, level } = useParams();

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