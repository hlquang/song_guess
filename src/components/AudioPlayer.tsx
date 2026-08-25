import { useCallback, useEffect, useState } from 'react';
import { useGameContext } from '../context/GameContext';
import { useAudioController } from '../hooks/useAudioController';
import { STEP_THRESHOLDS } from '../utils/audioTiming';

export default function AudioPlayer() {
  const ctx = useGameContext();
  const { currentTrack, currentStep, gameStatus, isPlaying, advanceStep, play, pause, giveUp, attempts } = ctx;
  const [wrongFlash, setWrongFlash] = useState(false);

  useEffect(() => {
    const last = attempts[attempts.length - 1];
    if (last && !last.correct) {
      setWrongFlash(true);
      const timer = setTimeout(() => setWrongFlash(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [attempts]);

  const handleThresholdReached = useCallback(() => {
    ctx.pause();
  }, [ctx.pause]);

  const {
    currentTime,
    isLoading,
    error,
    seekToTime,
    restart,
    retry,
  } = useAudioController({
    track: currentTrack,
    currentStep,
    gameStatus,
    isPlaying,
    onTimeUpdate: () => {},
    onThresholdReached: handleThresholdReached,
  });

  const currentThreshold = STEP_THRESHOLDS[currentStep];
  const maxThreshold = STEP_THRESHOLDS[STEP_THRESHOLDS.length - 1];

  const handleRevealMore = useCallback(() => {
    if (currentStep < STEP_THRESHOLDS.length - 1) {
      advanceStep();
    }
  }, [currentStep, advanceStep]);

  const handleSkip = useCallback(() => {
    giveUp();
  }, [giveUp]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      const atThreshold = currentTime >= currentThreshold - 0.05;

      if (atThreshold) {
        restart();
      } else {
        play();
      }
    }
  }, [isPlaying, play, pause, currentTime, currentThreshold, restart]);

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = fraction * maxThreshold;

    if (targetTime > currentThreshold) return;

    seekToTime(targetTime);
  }, [currentThreshold, maxThreshold, seekToTime]);

  if (!currentTrack) return null;

  const progress = Math.max(0, Math.min(1, currentTime / maxThreshold));

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {isLoading && (
        <div className="text-sm text-pink-400 mb-2">Đang tải...</div>
      )}

      {error && (
        <div className="text-sm text-red-400 mb-2">
          {error}
          <button
            onClick={retry}
            className="ml-2 underline text-red-300 hover:text-red-200"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Timeline bar with step labels */}
      <div className="relative mb-6">
        {wrongFlash && (
          <div className="absolute -top-14 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <span className="text-5xl font-extrabold text-red-500">Tầm bậy!</span>
          </div>
        )}

        {/* Bar */}
        <div
          className="relative h-3 bg-pink-200 rounded-full cursor-pointer"
          onClick={handleBarClick}
          role="slider"
          aria-label="Audio timeline"
          aria-valuemin={0}
          aria-valuemax={maxThreshold}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          {/* Unlocked portion */}
          <div
            className="absolute inset-y-0 left-0 bg-pink-300 rounded-full"
            style={{ width: `${(currentThreshold / maxThreshold) * 100}%` }}
          />
          {/* Played portion */}
          <div
            className="absolute inset-y-0 left-0 bg-pink-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Step labels positioned on the bar */}
        <div className="relative h-6 mt-1">
          {STEP_THRESHOLDS.map((threshold, index) => {
            const position = (threshold / maxThreshold) * 100;
            const isUnlocked = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <button
                key={threshold}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    const start = index > 0 ? STEP_THRESHOLDS[index - 1] : 0;
                    seekToTime(start);
                  }
                }}
                className={`absolute -translate-x-1/2 text-xs transition-colors ${
                  isCurrent ? 'text-pink-700 font-bold' : isUnlocked ? 'text-pink-500' : 'text-pink-300'
                } ${isUnlocked ? 'cursor-pointer hover:text-pink-700' : 'cursor-not-allowed'}`}
                style={{ left: `${position}%` }}
              >
                {threshold < 1 ? `${threshold}s` : `${threshold}s`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePlayPause}
          disabled={gameStatus !== 'PLAYING' || isLoading}
          className="px-5 py-2 bg-pink-500 text-white text-sm rounded hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPlaying ? 'Tạm dừng' : isLoading ? 'Đang tải...' : 'Phát'}
        </button>

        <button
          onClick={handleRevealMore}
          disabled={gameStatus !== 'PLAYING' || currentStep >= STEP_THRESHOLDS.length - 1}
          className="px-5 py-2 bg-rose-400 text-white text-sm rounded hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Nghe thêm
        </button>

        <button
          onClick={handleSkip}
          disabled={gameStatus !== 'PLAYING'}
          className="px-5 py-2 bg-pink-100 text-gray-700 text-sm rounded hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
