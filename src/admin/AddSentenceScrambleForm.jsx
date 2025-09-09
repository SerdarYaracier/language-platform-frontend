import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function AddSentenceScrambleForm() {
  const [correctSentence, setCorrectSentence] = useState('');
  const [shuffledWords, setShuffledWords] = useState(''); // comma-separated
  const [lang, setLang] = useState('en');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      await axios.post(`${API_URL}/api/admin/sentence-scramble`, {
        correct_sentence: correctSentence,
        shuffled_words: shuffledWords.split(',').map(s => s.trim()).filter(Boolean),
        lang,
      });
      setStatus('Saved successfully');
      setCorrectSentence('');
      setShuffledWords('');
    } catch (err) {
      console.error(err);
      setStatus('Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg w-full">
      <h3 className="text-lg font-bold mb-2">Add Sentence Scramble</h3>
      <label className="block text-sm mb-1">Language</label>
      <input value={lang} onChange={e=>setLang(e.target.value)} className="w-full mb-2 p-2 rounded" />

      <label className="block text-sm mb-1">Correct sentence</label>
      <input value={correctSentence} onChange={e=>setCorrectSentence(e.target.value)} className="w-full mb-2 p-2 rounded" />

      <label className="block text-sm mb-1">Shuffled words (comma separated)</label>
      <input value={shuffledWords} onChange={e=>setShuffledWords(e.target.value)} className="w-full mb-3 p-2 rounded" />

      <div className="flex gap-2">
        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded">Save</button>
        <span className="self-center text-sm">{status}</span>
      </div>
    </form>
  );
}
