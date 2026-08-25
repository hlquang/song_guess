import { useGameContext } from '../context/GameContext';

export default function StreakCounter() {
  const ctx = useGameContext();
  const { stats } = ctx;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <span>{stats.currentStreak > 0 ? '🔥' : '😔'}</span>
        <span className="font-bold">{stats.currentStreak}</span>
      </div>
      <div className="text-pink-500">
        Chuỗi dài nhứt: <span className="text-gray-800 font-bold">{stats.maxStreak}</span>
      </div>
    </div>
  );
}
