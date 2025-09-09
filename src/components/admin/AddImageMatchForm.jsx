import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AddImageMatchForm = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState({ tr: ['', '', '', ''], en: ['', '', '', ''], ja: ['', '', '', ''] });
  const [answer, setAnswer] = useState({ tr: '', en: '', ja: '' });
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const handleOptionChange = (lang, index, value) => {
    setOptions(prev => {
      const newLangOptions = [...prev[lang]];
      newLangOptions[index] = value;
      return { ...prev, [lang]: newLangOptions };
    });
  };

  const handleAnswerChange = (lang, value) => {
    setAnswer(prev => ({ ...prev, [lang]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: 'Submitting...', type: 'info' });
    const payload = {
      image_url: imageUrl,
      options: options,
      answer: answer
    };
    try {
      const response = await axios.post(`${API_URL}/api/games/image-match`, payload);
      setFeedback({ message: response.data.message, type: 'success' });
      // Formu temizle
      setImageUrl('');
      setOptions({ tr: ['', '', '', ''], en: ['', '', '', ''], ja: ['', '', '', ''] });
      setAnswer({ tr: '', en: '', ja: '' });
    } catch (error) {
      setFeedback({ message: error.response?.data?.error || 'An error occurred.', type: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl text-purple-400 font-bold">Add New Image Match Game</h2>
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300">Image URL</label>
        <p className="text-xs text-gray-400 mb-1">Upload image to Supabase Storage first, then paste the public URL here.</p>
        <input type="url" name="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"/>
      </div>
      
      {/* Dil Grupları */}
      {['tr', 'en', 'ja'].map(lang => (
        <fieldset key={lang} className="border border-gray-600 p-4 rounded-md">
          <legend className="px-2 text-lg font-semibold text-white">{lang.toUpperCase()}</legend>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Options (4 choices, one must be the answer)</label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                {[0, 1, 2, 3].map(index => (
                  <input key={index} type="text" value={options[lang][index]} onChange={(e) => handleOptionChange(lang, index, e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Correct Answer</label>
              <input type="text" value={answer[lang]} onChange={(e) => handleAnswerChange(lang, e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
            </div>
          </div>
        </fieldset>
      ))}

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

export default AddImageMatchForm;
