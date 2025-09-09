import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function AddImageMatchForm() {
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState(''); // comma-separated
  const [answer, setAnswer] = useState('');
  const [lang, setLang] = useState('en');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      await axios.post(`${API_URL}/api/admin/image-match`, {
        image_url: imageUrl,
        options: options.split(',').map(s => s.trim()).filter(Boolean),
        answer,
        lang,
      });
      setStatus('Saved successfully');
      setImageUrl(''); setOptions(''); setAnswer('');
    } catch (err) {
      console.error(err);
      setStatus('Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg w-full">
      <h3 className="text-lg font-bold mb-2">Add Image Match</h3>

      <label className="block text-sm mb-1">Language</label>
      <input value={lang} onChange={e=>setLang(e.target.value)} className="w-full mb-2 p-2 rounded" />

      <label className="block text-sm mb-1">Image URL</label>
      <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full mb-2 p-2 rounded" />

      <label className="block text-sm mb-1">Options (comma separated)</label>
      <input value={options} onChange={e=>setOptions(e.target.value)} className="w-full mb-2 p-2 rounded" />

      <label className="block text-sm mb-1">Correct answer (one of options)</label>
      <input value={answer} onChange={e=>setAnswer(e.target.value)} className="w-full mb-3 p-2 rounded" />

      <div className="flex gap-2">
        <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded">Save</button>
        <span className="self-center text-sm">{status}</span>
      </div>
    </form>
  );
}
