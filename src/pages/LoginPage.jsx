import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = ({ onClose, onOpenSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
  if (typeof onClose === 'function') onClose();
  navigate('/'); // Başarılı girişte ana sayfaya yönlendir
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl text-center font-bold mb-6 text-white">Login</h2>
        {error && <p className="bg-red-500 text-white text-center p-2 rounded mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            id="email"
            required
            className="w-full px-3 py-2 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            id="password"
            required
            className="w-full px-3 py-2 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-400 text-sm">
        Don't have an account? {onOpenSignup ? (
          <button onClick={onOpenSignup} className="text-cyan-400 hover:text-cyan-300">Sign Up</button>
        ) : (
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300">Sign Up</Link>
        )}
      </p>
    </div>
  );
};
export default LoginPage;
