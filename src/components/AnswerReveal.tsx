import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameContext } from '../context/GameContext';

export default function AnswerReveal() {
  const ctx = useGameContext();
  const { currentTrack, gameStatus, nextTrack, volume } = ctx;

  if (!currentTrack || (gameStatus !== 'WON' && gameStatus !== 'LOST')) {
    return null;
  }

  const isWon = gameStatus === 'WON';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!currentTrack?.preview_url) return;
    const audio = new Audio(currentTrack.preview_url);
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (dragRef.current) return;
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
      setIsPlaying(false);
      setIsLoading(false);
    };
  }, [currentTrack?.preview_url]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const durationRef = useRef(duration);
  const currentTimeRef = useRef(currentTime);
  const audioRefCurrent = useRef(audioRef.current);
  const setIsPlayingRef = useRef(setIsPlaying);
  const setCurrentTimeRef = useRef(setCurrentTime);

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { audioRefCurrent.current = audioRef.current; }, [audioRef.current]);
  useEffect(() => { setIsPlayingRef.current = setIsPlaying; }, [setIsPlaying]);
  useEffect(() => { setCurrentTimeRef.current = setCurrentTime; }, [setCurrentTime]);

  const handleBarMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const audio = audioRef.current;
    if (!audio || !durationRef.current) return;

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
      const targetTime = fraction * durationRef.current;

      const dx = Math.abs(moveEvent.clientX - startXRef.current);
      if (dx > 3) {
        hasDraggedRef.current = true;
        if (wasPlayingRef.current) {
          audio.pause();
          setIsPlayingRef.current(false);
        }
      }

      if (hasDraggedRef.current) {
        audio.currentTime = targetTime;
        setCurrentTimeRef.current(targetTime);
      }
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      dragRef.current = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (hasDraggedRef.current && wasPlayingRef.current) {
        const audio = audioRefCurrent.current;
        if (audio) {
          audio.play().then(() => setIsPlayingRef.current(true)).catch(() => setIsPlayingRef.current(false));
        }
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
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = fraction * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  }, [duration]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const audio = audioRef.current;
    if (!audio || !duration) return;

    setIsDragging(true);
    dragRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = touch.clientX;
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, duration]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const targetTime = fraction * durationRef.current;

    const dx = Math.abs(touch.clientX - startXRef.current);
    if (dx > 3) {
      hasDraggedRef.current = true;
      if (wasPlayingRef.current) {
        audioRef.current?.pause();
        setIsPlayingRef.current(false);
      }
    }

    if (hasDraggedRef.current) {
      audioRef.current!.currentTime = targetTime;
      setCurrentTimeRef.current(targetTime);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setIsDragging(false);

    if (hasDraggedRef.current && wasPlayingRef.current) {
      const audio = audioRef.current;
      if (audio) {
        audio.play().then(() => setIsPlayingRef.current(true)).catch(() => setIsPlayingRef.current(false));
      }
    }
  }, []);

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
    nextTrack();
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const hasPreview = !!currentTrack.preview_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-900/30 p-3 sm:p-4">
      <div className="bg-white border border-pink-200 rounded-2xl p-4 sm:p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-4">
          <h2 className={`text-2xl font-bold ${isWon ? 'text-pink-600' : 'text-gray-600'}`}>
            {isWon ? 'Đúng rồi!' : 'Sai rồi! Bài hát là:'}
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          {currentTrack.album_art && (
            <img
              src={currentTrack.album_art}
              alt={currentTrack.name}
              className="w-32 h-32 sm:w-48 sm:h-48 rounded-lg object-cover shadow-lg"
            />
          )}

          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">{currentTrack.name}</h3>
            <p className="text-pink-500 mt-1">{currentTrack.primary_artist}</p>
          </div>

          <div className="w-full flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!hasPreview || isLoading}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div
              ref={barRef}
              className={`flex-1 h-2 bg-pink-100 rounded-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
              style={{ userSelect: isDragging ? 'none' : undefined }}
              onMouseDown={handleBarMouseDown}
              onClick={handleBarClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              role={hasPreview ? 'slider' : undefined}
              aria-label="Audio progress"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration || 0)}
              aria-valuenow={Math.floor(currentTime)}
              tabIndex={hasPreview ? 0 : undefined}
            >
              <div
                className={`h-full bg-pink-500 rounded-full ${isDragging ? 'transition-none' : 'transition-all'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            {!hasPreview && (
              <span className="text-xs text-gray-400 shrink-0">Không có preview</span>
            )}
          </div>

          <a
            href={currentTrack.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.18c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Nghe trên Spotify
          </a>

          <button
            onClick={handleNext}
            className="mt-2 px-6 py-2 bg-pink-100 text-gray-700 rounded-lg hover:bg-pink-200 transition-colors"
          >
            Bài tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
}
