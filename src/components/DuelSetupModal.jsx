import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext'; // Mevcut kullanıcının ID'si için

const DuelSetupModal = ({ isOpen, onClose, friends = [] }) => {
  const { user } = useAuth(); // Mevcut kullanıcı bilgisi için
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Modal açılıp kapandığında state'leri sıfırla
  useEffect(() => {
    if (!isOpen) {
      setSelectedOpponent(null);
      setSelectedDifficulty(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDuel = async () => {
    if (!selectedOpponent || selectedDifficulty === null) {
      setError('Please select an opponent and a difficulty level.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Backend'e düello oluşturma isteği gönder
      // NOT: Bu endpoint, Challenger'ın oynadığı skoru ve süreyi de bekliyor.
      // Henüz oyun oynamadığı için bu değerleri varsayılan olarak 0 veya null gönderiyoruz.
      // Backend'in bu durumu ele alması veya bu API'yi Challenger'ın oyunu bitirdikten sonra çağırması gerekecek.
      // Şu anki backend tasarımımızda 'challenger_score' vs. bilgileri doğrudan bekliyor.
      // Bu nedenle, akış şöyle olmalı:
      // 1. DuelSetupModal: Challenged oyuncuyu ve zorluk seviyesini seç.
      // 2. navigate(`/duel/create?challenged_id=${selectedOpponent.id}&difficulty=${selectedDifficulty}`);
      // 3. DuelGamePage: Bu sayfada ilk olarak sorular çekilir, Challenger oynar, puanı ve süreyi kaydeder ve sonra create-duel API'sini çağırır.
      // Mevcut Backend Tasarımına Uyumlu hale getirelim:
      // Backend'deki create-duel endpoint'i hem duel oluşturup hem de challenger'ın skorunu bekliyor.
      // Bu demektir ki, user önce zorluk ve rakip seçecek, sonra oyun oynamaya başlayacak, oyunu bitince skorunu ve süre bilgisiyle birlikte backend'e duel oluşturma isteğini atacak.

      // BU KISIMDAKİ MANTIK DEĞİŞİKLİĞİ KRİTİK:
      // DuelSetupModal'dan doğrudan create-duel çağıramayız çünkü challenger_score ve challenger_time_taken elimizde yok.
      // Bunun yerine, DuelGamePage'e yönlenmeliyiz ve Challenger oyunu oynadıktan sonra backend'e POST etmeli.
      
      // Geçici olarak, Challenge anında sadece temel bilgileri içeren bir "placeholder" duel oluşturup,
      // sonra DuelGamePage'e yönlendirip orada Challenger'ın sonuçlarını eklemeyi düşünebiliriz.
      // VEYA, daha basit ve mevcut backend API'sine uygun olarak:
      // Modal'dan seçimi yapıp, doğrudan oyun oynamaya başla. Oyun bitince "create-duel" endpoint'ini çağır.
      // Bu durumda, oyun başlamadan challenger_score ve time_taken bilgisi olmaz.

      // Önceki backend mantığınıza göre, create-duel endpoint'i Challenger'ın skorunu ve süresini bekliyor.
      // Bu yüzden buradaki akış:
      // 1. Kullanıcı bu modalda rakibi ve zorluğu seçer.
      // 2. Bir "Hazır" durumuna geçer ve oyun sayfasında "START" tuşuna basar.
      // 3. Oyun oynar.
      // 4. Oyun bitince, *bu modaldan gelen bilgilerle birlikte* skoru ve süreyi backend'e gönderir.
      // BU YAPI İÇİN DUELGAMEPAGE'İN 'create' modunda çalışması gerekecek.

      // Yeni Akış İçin Yönlendirme:
      navigate(`/duel/play?challenged_id=${selectedOpponent.id}&difficulty=${selectedDifficulty}`);
      onClose(); // Modalı kapat
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate duel.');
      console.error("Duel initiation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const difficultyLevels = [
    { label: "Level 1", level: 1 },
    { label: "Level 2", level: 2 },
    { label: "Level 3", level: 3 },
    { label: "Level 4", level: 4 },
    { label: "Level 5", level: 5 },
    { label: "ALL", level: 0 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl p-6 border border-red-400/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 text-white">
          <h3 className="text-2xl font-bold">Duel Setup</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Challenge Edilecek Arkadaşı Seçme */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-white">Your Friends: Select an Opponent</h4>
          <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {friends.length > 0 ? friends.map(f => (
              // Mevcut kullanıcıyı listeden hariç tut
              f.id !== user?.id && (
                <div 
                  key={f.id} 
                  onClick={() => setSelectedOpponent(f)} 
                  className={`min-w-[180px] p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-200 
                              ${selectedOpponent && selectedOpponent.id === f.id ? 'bg-red-700/50 border border-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <img src={f.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${f.username}`} alt={f.username} className="w-12 h-12 rounded-full bg-gray-600 border border-gray-500" />
                  <div>
                    <div className="font-bold text-white">{f.username}</div>
                    <div className="text-xs text-gray-300">{f.email || ''}</div>
                  </div>
                </div>
              )
            )) : <div className="text-gray-400">No friends available to challenge.</div>}
          </div>
        </div>

        {selectedOpponent && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-4 text-white">Selected Challenger: <span className="text-cyan-400">{selectedOpponent.username}</span></h4>
            
            {/* Zorluk Seviyesi Seçimi */}
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Select Duel Difficulty</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {difficultyLevels.map(item => (
                  <button
                    key={item.level}
                    onClick={() => setSelectedDifficulty(item.level)}
                    className={`py-3 px-4 rounded-lg font-bold transition-all duration-200 
                                ${selectedDifficulty === item.level ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelectedOpponent(null)} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition">Change Opponent</button>
              <button 
                onClick={handleStartDuel} 
                className={`py-2 px-4 rounded-lg font-bold transition ${selectedDifficulty === null ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'}`}
                disabled={isLoading || selectedDifficulty === null}
              >
                {isLoading ? 'Starting Duel...' : 'Start Duel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuelSetupModal;