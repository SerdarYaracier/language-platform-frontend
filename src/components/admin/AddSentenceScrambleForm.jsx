import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AddSentenceScrambleForm = () => {
  const [sentences, setSentences] = useState({ tr: '', en: '', ja: '' });
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSentences(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: 'Submitting...', type: 'info' });
    try {
      const response = await axios.post(`${API_URL}/api/games/sentence-scramble`, sentences);
      setFeedback({ message: response.data.message, type: 'success' });
      setSentences({ tr: '', en: '', ja: '' }); // Formu temizle
    } catch (error) {
      setFeedback({ message: error.response?.data?.error || 'An error occurred.', type: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl text-cyan-400 font-bold">Add New Sentence Scramble Game</h2>
      <div>
        <label htmlFor="tr" className="block text-sm font-medium text-gray-300">Turkish Sentence</label>
        <input type="text" name="tr" value={sentences.tr} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
      </div>
      <div>
        <label htmlFor="en" className="block text-sm font-medium text-gray-300">English Sentence</label>
        <input type="text" name="en" value={sentences.en} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
      </div>
      <div>
        <label htmlFor="ja" className="block text-sm font-medium text-gray-300">Japanese Sentence</label>
        <input type="text" name="ja" value={sentences.ja} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Save Game
      </button>
      {feedback.message && (
        <p className={`mt-4 text-center ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.message}
        </p>
      )}
    </form>
  );
};

export default AddSentenceScrambleForm;
