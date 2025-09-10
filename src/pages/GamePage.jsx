import React from 'react';
import { useParams } from 'react-router-dom';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import ImageMatchGame from '../components/games/ImageMatchGame';
import FillInTheBlankGame from '../components/games/FillInTheBlankGame';

const GamePage = () => {
  // URL'den hem oyunun türünü hem de kategorisini alıyoruz
  const { gameSlug, categorySlug } = useParams();

  // Her oyuna artık categorySlug'ı bir prop olarak iletiyoruz
  switch (gameSlug) {
    case 'sentence-scramble':
      return <SentenceScrambleGame categorySlug={categorySlug} />;
    case 'image-match':
      return <ImageMatchGame categorySlug={categorySlug} />;
    case 'fill-in-the-blank':
      return <FillInTheBlankGame categorySlug={categorySlug} />;
    default:
      return <p>Game not found!</p>;
  }
};

export default GamePage;