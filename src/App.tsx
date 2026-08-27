import { useEffect, useMemo, useState } from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import AudioPlayer from './components/AudioPlayer';
import SearchBar from './components/SearchBar';

import StreakCounter from './components/StreakCounter';
import AnswerReveal from './components/AnswerReveal';
import VolumeControl from './components/VolumeControl';
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
  const { currentTrack, startNewGame, restoreGame } = ctx;

  useEffect(() => {
    if (!currentTrack && tracks.length > 0) {
      try {
        const saved = localStorage.getItem('song_guess_game_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          const track = tracks.find(t => t.id === parsed.currentTrack?.id);
          if (track && parsed.currentTrack) {
            restoreGame({
              currentTrack: track,
              currentStep: parsed.currentStep,
              gameStatus: parsed.gameStatus,
              attempts: parsed.attempts,
              playedTrackIds: parsed.playedTrackIds,
            });
            return;
          }
        }
      } catch {
        // ignore and fall back to random track
      }
      const shuffled = shuffleArray(tracks);
      startNewGame(shuffled[0]);
    }
  }, [currentTrack, startNewGame, restoreGame, tracks]);

  if (!currentTrack) {
    return (
      <div className="h-screen bg-pink-50 text-gray-800 flex items-center justify-center">
        <div className="text-pink-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-pink-50 text-gray-800 flex flex-col">
      <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-pink-200 bg-white/60" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <h1 className="text-lg sm:text-xl font-bold text-pink-600">Songvia</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <VolumeControl />
          <StreakCounter />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-6 p-3 sm:p-4 overflow-hidden min-h-0">
        <AudioPlayer />

      </main>

      <footer className="px-3 py-3 sm:px-4 sm:py-4 border-t border-pink-200 bg-white/60" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
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
      <div className="h-screen bg-pink-50 text-gray-800 flex items-center justify-center">
        <div className="text-red-500">Tải dữ liệu nhạc thất bại. Hãy thử lại.</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
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
