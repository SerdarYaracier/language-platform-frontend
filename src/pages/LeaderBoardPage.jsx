import React, { useState, useEffect } from 'react';
import api from '../api';
import LeaderboardTable from '../components/LeaderboardTable';

const LeaderboardPage = () => {
  const [leaderboards, setLeaderboards] = useState({
    total_score: [],
    mixed_rush: [],
    image_match: [],
    sentence_scramble: [],
    fill_in_the_blank: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true);
      try {
        const [totalRes, rushRes, imageRes, scrambleRes, blankRes] = await Promise.all([
          api.get('/api/leaderboard/total-score'),
          api.get('/api/leaderboard/mixed-rush'),
          api.get('/api/leaderboard/game/image-match'),
          api.get('/api/leaderboard/game/sentence-scramble'),
          api.get('/api/leaderboard/game/fill-in-the-blank'),
        ]);
        setLeaderboards({
          total_score: totalRes.data,
          mixed_rush: rushRes.data,
          image_match: imageRes.data,
          sentence_scramble: scrambleRes.data,
          fill_in_the_blank: blankRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch leaderboards", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboards();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h1 className="text-5xl font-bold mb-8 text-center text-yellow-400">Leaderboards</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeaderboardTable title="Total Score" scores={leaderboards.total_score} isLoading={isLoading} />
        <LeaderboardTable title="Mixed Rush" scores={leaderboards.mixed_rush} isLoading={isLoading} />
        <LeaderboardTable title="Image Match" scores={leaderboards.image_match} isLoading={isLoading} />
        <LeaderboardTable title="Sentence Scramble" scores={leaderboards.sentence_scramble} isLoading={isLoading} />
        <LeaderboardTable title="Fill in the Blank" scores={leaderboards.fill_in_the_blank} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default LeaderboardPage;