import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SentenceScrambleGame from './components/games/SentenceScrambleGame';
import ImageMatchGame from './components/games/ImageMatchGame';
import AdminPage from './pages/AdminPage';
import FillInTheBlankGame from './components/games/FillInTheBlankGame';
import MixedRushGame from './components/games/MixedRushGame';


function App() {
  return (
    // Genel sayfa düzeni: Header her zaman görünür olacak
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      
      <main className="container mx-auto p-8 flex justify-center items-center">
        {/* Routes, URL yoluna göre hangi bileşenin render edileceğini belirler */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/game/image-match" element={<ImageMatchGame />} />
          <Route path="/game/sentence-scramble" element={<SentenceScrambleGame />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/game/fill-in-the-blank" element={<FillInTheBlankGame />} />
          <Route path="/game/mixed-rush" element={<MixedRushGame />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;