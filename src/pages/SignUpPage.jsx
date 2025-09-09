import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignupPage = ({ onClose, onOpenLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      // Pass username as user metadata to Supabase
      const payload = { email, password, options: { data: { username } } };
      const { error } = await signUp(payload);
      if (error) throw error;
  setMessage('Signup successful! Please check your email to confirm.');
  if (typeof onClose === 'function') onClose();
  // Kullanıcıyı bilgilendirdikten sonra login sayfasına yönlendirebiliriz
  setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };
  
  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl text-center font-bold mb-6 text-white">Sign Up</h2>
        {error && <p className="bg-red-500 text-white text-center p-2 rounded mb-4">{error}</p>}
        {message && <p className="bg-green-500 text-white text-center p-2 rounded mb-4">{message}</p>}
          {/* Username, Email ve Password inputları */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">Username</label>
            <input
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              type="text"
              id="username"
              required
              className="w-full px-3 py-2 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
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
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-400 text-sm">
        Already have an account? {onOpenLogin ? (
          <button onClick={onOpenLogin} className="text-cyan-400 hover:text-cyan-300">Login</button>
        ) : (
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Login</Link>
        )}
      </p>
    </div>
  );
};
export default SignupPage;
