import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameContext } from '../context/GameContext';
import { useAudioController } from '../hooks/useAudioController';
import { STEP_THRESHOLDS } from '../utils/audioTiming';
import { suppressSearchClose } from '../utils/searchBarEvents';

export default function AudioPlayer() {
  const ctx = useGameContext();
  const { currentTrack, currentStep, gameStatus, isPlaying, advanceStep, play, pause, giveUp, attempts, volume } = ctx;
  const [wrongFlash, setWrongFlash] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const last = attempts[attempts.length - 1];
    if (last && !last.correct) {
      setWrongFlash(true);
      const timer = setTimeout(() => setWrongFlash(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [attempts]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden && gameStatus === 'PLAYING') {
        pause();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [gameStatus, pause]);

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
    volume,
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

  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const currentThresholdRef = useRef(currentThreshold);
  const maxThresholdRef = useRef(maxThreshold);
  const seekToTimeRef = useRef(seekToTime);
  const playRef = useRef(play);
  const pauseRef = useRef(pause);

  useEffect(() => { currentThresholdRef.current = currentThreshold; }, [currentThreshold]);
  useEffect(() => { maxThresholdRef.current = maxThreshold; }, [maxThreshold]);
  useEffect(() => { seekToTimeRef.current = seekToTime; }, [seekToTime]);
  useEffect(() => { playRef.current = play; }, [play]);
  useEffect(() => { pauseRef.current = pause; }, [pause]);

  const handleBarMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    wasPlayingRef.current = isPlaying;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const targetTime = fraction * maxThresholdRef.current;

      if (targetTime > currentThresholdRef.current) return;

      const dx = Math.abs(moveEvent.clientX - startXRef.current);
      if (dx > 3) {
        hasDraggedRef.current = true;
        if (wasPlayingRef.current) {
          pauseRef.current();
        }
      }

      if (hasDraggedRef.current) {
        seekToTimeRef.current(targetTime);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (hasDraggedRef.current && wasPlayingRef.current) {
        setTimeout(() => playRef.current(), 0);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isPlaying]);

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = fraction * maxThreshold;

    if (targetTime > currentThreshold) return;

    seekToTime(targetTime);
  }, [currentThreshold, maxThreshold, seekToTime]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    dragRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = touch.clientX;
    wasPlayingRef.current = isPlaying;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const targetTime = fraction * maxThreshold;

    if (targetTime > currentThreshold) return;

    const dx = Math.abs(touch.clientX - startXRef.current);
    if (dx > 3) {
      hasDraggedRef.current = true;
      if (wasPlayingRef.current && isPlaying) {
        pause();
      }
    }

    if (hasDraggedRef.current) {
      seekToTime(targetTime);
    }
  };

  const handleTouchEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = false;

    if (hasDraggedRef.current && wasPlayingRef.current) {
      setTimeout(() => play(), 0);
    }
  };

  if (!currentTrack) return null;

  const progress = Math.max(0, Math.min(1, currentTime / maxThreshold));

  return (
    <div className="w-full max-w-2xl mx-auto p-3 sm:p-4">
      {isLoading && (
        <div className="text-xs sm:text-sm text-pink-400 mb-2">Đang tải...</div>
      )}

      {error && (
        <div className="text-xs sm:text-sm text-red-400 mb-2">
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
      <div className="relative mb-3 sm:mb-6">
        {wrongFlash && (
          <div className="absolute -top-10 sm:-top-14 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <span className="text-3xl sm:text-5xl font-extrabold text-red-500">Tầm bậy!</span>
          </div>
        )}

        {/* Bar */}
        <div
          ref={barRef}
          className={`relative h-3 bg-pink-200 rounded-full ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
          style={{ userSelect: isDragging ? 'none' : undefined }}
          onMouseDown={handleBarMouseDown}
          onClick={handleBarClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                className={`absolute -translate-x-1/2 text-[10px] sm:text-xs transition-colors ${
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
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={handlePlayPause}
          onMouseDown={suppressSearchClose}
          disabled={gameStatus !== 'PLAYING' || isLoading}
          className="px-4 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPlaying ? 'Tạm dừng' : isLoading ? 'Đang tải...' : 'Phát'}
        </button>

        <button
          onClick={handleRevealMore}
          onMouseDown={suppressSearchClose}
          disabled={gameStatus !== 'PLAYING' || currentStep >= STEP_THRESHOLDS.length - 1}
          className="px-4 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm bg-rose-400 text-white rounded hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Nghe thêm
        </button>

        <button
          onClick={handleSkip}
          onMouseDown={suppressSearchClose}
          disabled={gameStatus !== 'PLAYING'}
          className="px-4 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm bg-pink-100 text-gray-700 rounded hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Bỏ qua
        </button>
      </div>

    </div>
  );
}
