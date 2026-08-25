import { useGameContext } from '../context/GameContext';

export default function NextTrackButton() {
  const ctx = useGameContext();
  const { nextTrack, gameStatus } = ctx;

  return (
    <button
      onClick={nextTrack}
      disabled={gameStatus !== 'WON' && gameStatus !== 'LOST'}
      className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Bài tiếp theo
    </button>
  );
}
