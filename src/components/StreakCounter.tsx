import { useGameContext } from '../context/GameContext';

export default function StreakCounter() {
  const ctx = useGameContext();
  const { stats } = ctx;

  return (
    <div className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm">
      <div className="flex items-center gap-0.5 sm:gap-1 min-w-[3ch]">
        <span>⚡</span>
        <span className="font-bold">{stats.lightningCount}</span>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 min-w-[3ch]">
        <span>🔥</span>
        <span className="font-bold">{stats.currentStreak}</span>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 min-w-[3ch]">
        <span className="hidden sm:inline">Chuỗi dài nhứt:</span>
        <span className="sm:hidden">Max:</span>
        <span className="text-gray-800 font-bold">{stats.maxStreak}</span>
      </div>
    </div>
  );
}
