import React, { useState } from 'react';
import AddSentenceScrambleForm from '../components/admin/AddSentenceScrambleForm';
import AddImageMatchForm from '../components/admin/AddImageMatchForm';

const AdminPage = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const renderForm = () => {
    switch (selectedGame) {
      case 'sentence-scramble':
        return <AddSentenceScrambleForm />;
      case 'image-match':
        return <AddImageMatchForm />;
      default:
        return <p className="text-gray-400">Please select a game type to add new content.</p>;
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center text-white">Admin Panel</h1>
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setSelectedGame('sentence-scramble')}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Sentence Scramble
        </button>
        <button
          onClick={() => setSelectedGame('image-match')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Image Match
        </button>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg">
        {renderForm()}
      </div>
    </div>
  );
};

export default AdminPage;
