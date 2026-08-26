import { useGameContext } from '../context/GameContext';

export default function StreakCounter() {
  const ctx = useGameContext();
  const { stats } = ctx;

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-1 min-w-[4ch]">
        <span>⚡</span>
        <span className="font-bold">{stats.lightningCount}</span>
      </div>
      <div className="flex items-center gap-1 min-w-[4ch]">
        <span>🔥</span>
        <span className="font-bold">{stats.currentStreak}</span>
      </div>
      <div className="flex items-center gap-1 min-w-[4ch]">
        <span>Chuỗi dài nhứt:</span>
        <span className="text-gray-800 font-bold">{stats.maxStreak}</span>
      </div>
    </div>
  );
}
