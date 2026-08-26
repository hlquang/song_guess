import { useEffect, useMemo, useState } from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import AudioPlayer from './components/AudioPlayer';
import SearchBar from './components/SearchBar';

import StreakCounter from './components/StreakCounter';
import AnswerReveal from './components/AnswerReveal';
import { SpotifyTrack } from './types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function GameContent({ tracks }: { tracks: SpotifyTrack[] }) {
  const ctx = useGameContext();
  const { currentTrack, startNewGame } = ctx;

  useEffect(() => {
    if (!currentTrack && tracks.length > 0) {
      const shuffled = shuffleArray(tracks);
      startNewGame(shuffled[0]);
    }
  }, [currentTrack, startNewGame, tracks]);

  if (!currentTrack) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-800 flex items-center justify-center">
        <div className="text-pink-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-pink-200 bg-white/60">
        <h1 className="text-xl font-bold text-pink-600">Songvia</h1>
        <StreakCounter />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <AudioPlayer />

      </main>

      <footer className="px-4 py-4 border-t border-pink-200 bg-white/60">
        <SearchBar />
      </footer>

      <AnswerReveal />
    </div>
  );
}

function App() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/tracks.json`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setTracks)
      .catch(() => setError(true));
  }, []);

  const shuffledTracks = useMemo(() => shuffleArray(tracks), [tracks]);

  useEffect(() => {
    (window as unknown as Record<string, SpotifyTrack[]>).__SONG_GUESS_TRACKS__ = tracks;
  }, [tracks]);

  if (error) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-800 flex items-center justify-center">
        <div className="text-red-500">Tải dữ liệu nhạc thất bại. Hãy thử lại.</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <GameProvider tracks={shuffledTracks}>
      <GameContent tracks={shuffledTracks} />
    </GameProvider>
  );
}

export default App;
