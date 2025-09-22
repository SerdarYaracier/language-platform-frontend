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
import CategorySelectionPage from './pages/CategorySelectionPage';
import GamePage from './pages/GamePage';
import LevelSelectionPage from './pages/LevelSelectionPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderBoardPage';
import DuelGamePage from './pages/DuelGamePage';
import DuelsListPage from './pages/DuelsListPage';



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
          <Route path="/categories/:gameSlug" element={<CategorySelectionPage />} />
          <Route path="/levels/:gameSlug/:categorySlug" element={<LevelSelectionPage />} />
          
          <Route path="/game/:gameSlug/:categorySlug/:level" element={<GamePage />} />
          
          <Route path="/admin" element={<AdminPage />} />
          
          <Route path="/game/mixed-rush" element={<MixedRushGame />} />
          <Route path="/leaderboards" element={<LeaderboardPage />} />

          <Route path="/duel/:duelId" element={<ProtectedRoute><DuelGamePage /></ProtectedRoute>} />
          {/* Challenger için yeni duel oluşturma akışı (query parametreleriyle) */}
          <Route path="/duel/play" element={<ProtectedRoute><DuelGamePage /></ProtectedRoute>} /> 
          <Route path="/duels" element={<ProtectedRoute><DuelsListPage /></ProtectedRoute>} />
          
          {/* YENİ GÜVENLİ PROFİL ROTASI */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;