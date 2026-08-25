import { useEffect, useRef, useState, useCallback } from 'react';
import { STEP_THRESHOLDS } from '../utils/audioTiming';
import { SpotifyTrack, GameStatus } from '../types';

export function useAudioController({
  track,
  currentStep,
  gameStatus,
  isPlaying,
  onTimeUpdate,
  onThresholdReached,
}: {
  track: SpotifyTrack | null;
  currentStep: number;
  gameStatus: GameStatus;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onThresholdReached: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackIdRef = useRef<string | null>(null);
  const isNewTrackRef = useRef(false);
  const stateRef = useRef({ isPlaying, currentStep, gameStatus });
  const callbacksRef = useRef({ onTimeUpdate, onThresholdReached });
  const loadAttemptRef = useRef(0);

  const log = (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[Audio]', ...args);
    }
  };

  useEffect(() => { stateRef.current.isPlaying = isPlaying; }, [isPlaying]);
  useEffect(() => { stateRef.current.currentStep = currentStep; }, [currentStep]);
  useEffect(() => { stateRef.current.gameStatus = gameStatus; }, [gameStatus]);
  useEffect(() => { callbacksRef.current = { onTimeUpdate, onThresholdReached }; }, [onTimeUpdate, onThresholdReached]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const loop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      rafRef.current = null;
      return;
    }

    const { isPlaying, currentStep, gameStatus } = stateRef.current;
    if (!isPlaying || gameStatus !== 'PLAYING') {
      rafRef.current = null;
      return;
    }

    const time = audio.currentTime;
    setCurrentTime(time);
    callbacksRef.current.onTimeUpdate(time);

    const threshold = STEP_THRESHOLDS[currentStep];
    if (time >= threshold) {
      audio.pause();
      audio.currentTime = threshold;
      stateRef.current.isPlaying = false;
      callbacksRef.current.onThresholdReached();
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, []);

  const applyPlayState = useCallback(() => {
    const audio = audioRef.current;
    const { isPlaying, gameStatus } = stateRef.current;
    if (!audio || gameStatus !== 'PLAYING') {
      audio?.pause();
      stopLoop();
      return;
    }

    if (isPlaying) {
      if (audio.readyState >= 2) {
        audio.play().catch(() => {
          stateRef.current.isPlaying = false;
          stopLoop();
        });
        stopLoop();
        rafRef.current = requestAnimationFrame(loop);
      }
    } else {
      audio.pause();
      stopLoop();
    }
  }, [loop, stopLoop]);

  useEffect(() => {
    applyPlayState();
  }, [isPlaying, applyPlayState]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      stopLoop();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [stopLoop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const isSameTrack = trackIdRef.current === track.id;
    loadAttemptRef.current += 1;

    if (!isSameTrack) {
      stopLoop();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsLoading(true);
      setError(null);
      setCurrentTime(0);
      isNewTrackRef.current = true;
      trackIdRef.current = track.id;
      audio.src = track.preview_url;
      audio.load();
    }

    const handleCanPlay = () => {
      log('canplay', { readyState: audio.readyState, duration: audio.duration });
      setIsLoading(false);
      setError(null);

      if (isNewTrackRef.current) {
        isNewTrackRef.current = false;
        audio.currentTime = 0;
        setCurrentTime(0);
      }

      if (stateRef.current.isPlaying && stateRef.current.gameStatus === 'PLAYING') {
        audio.play().catch(() => {
          stateRef.current.isPlaying = false;
          stopLoop();
        });
        stopLoop();
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    const handleError = () => {
      log('error', { readyState: audio.readyState, error: audio.error });
      setIsLoading(false);
      setError(audio.error ? `Audio load failed (code ${audio.error.code})` : 'Audio load failed');
    };

    const events = ['loadstart', 'progress', 'suspend', 'abort', 'emptied', 'stalled'];
    const handlers: Record<string, EventListener> = {
      canplay: handleCanPlay,
      error: handleError,
      loadstart: () => log('loadstart'),
      progress: () => log('progress'),
      suspend: () => log('suspend'),
      abort: () => log('abort'),
      emptied: () => log('emptied'),
      stalled: () => log('stalled'),
    };

    events.forEach(name => audio.addEventListener(name, handlers[name]!));
    audio.addEventListener('canplay', handleCanPlay, { once: true });
    audio.addEventListener('error', handleError, { once: true });

    if (audio.readyState >= 3) {
      log('readyState already sufficient', { readyState: audio.readyState });
      handleCanPlay();
      events.forEach(name => audio.removeEventListener(name, handlers[name]!));
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    }

    return () => {
      events.forEach(name => audio.removeEventListener(name, handlers[name]!));
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      if (trackIdRef.current === track?.id) {
        trackIdRef.current = null;
      }
    };
  }, [track?.id, track?.preview_url, stopLoop, loop]);



  useEffect(() => {
    const handler = () => {
      if (document.hidden && stateRef.current.isPlaying) {
        stateRef.current.isPlaying = false;
        applyPlayState();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [applyPlayState]);

  useEffect(() => {
    if (gameStatus !== 'PLAYING') {
      stateRef.current.isPlaying = false;
      applyPlayState();
    }
  }, [gameStatus, applyPlayState]);

  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (audio && audio.readyState >= 2 && !stateRef.current.isPlaying && stateRef.current.gameStatus === 'PLAYING') {
        stateRef.current.isPlaying = true;
        applyPlayState();
      }
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, [applyPlayState]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      const audio = audioRef.current;
      if (audio && isLoading) {
        log('load timeout', { readyState: audio.readyState, error: audio.error });
        setIsLoading(false);
        setError('Audio loading timed out');
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const seekToTime = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentThreshold = STEP_THRESHOLDS[currentStep];
    const clampedTime = Math.max(0, Math.min(time, currentThreshold));
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, [currentStep]);

  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    trackIdRef.current = null;
    setIsLoading(true);
    setError(null);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }, [track]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (stateRef.current.gameStatus !== 'PLAYING') return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);

    const onSeeked = () => {
      audio.removeEventListener('seeked', onSeeked);
      stateRef.current.isPlaying = true;
      const tryPlay = () => {
        audio.play().catch(() => {
          stateRef.current.isPlaying = false;
          stopLoop();
        });
        stopLoop();
        rafRef.current = requestAnimationFrame(loop);
      };

      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          tryPlay();
        };
        audio.addEventListener('canplay', onCanPlay, { once: true });
      }
    };

    audio.addEventListener('seeked', onSeeked, { once: true });
  }, [track, loop, stopLoop]);

  return {
    audioRef,
    currentTime,
    duration,
    isLoading,
    error,
    isPlaying,
    seekToTime,
    restart,
    retry,
  };
}
