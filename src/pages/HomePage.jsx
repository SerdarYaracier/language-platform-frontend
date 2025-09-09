import React from 'react';
import { Link } from 'react-router-dom'; // Sayfalar arası geçiş için Link bileşenini kullanıyoruz

const HomePage = () => {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold mb-4">
        Welcome to LinguaPlay!
      </h1>
      <p className="text-xl text-gray-300 mb-8">
        Are you ready to learn a new language by playing games?
      </p>
      <div className="flex justify-center items-center mt-8">
  <div className="grid grid-cols-2 gap-2">
          <Link
            to="/game/sentence-scramble"
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Sentence Scramble
          </Link>
          <Link
            to="/game/image-match"
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Image Match
          </Link>
          <Link
            to="/game/fill-in-the-blank"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Fill in the Blank
          </Link>
          <Link
            to="/game/mixed-rush"
            className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center h-40 w-40 rounded-2xl text-lg transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Mixed Rush
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;