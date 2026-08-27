import { createContext, useContext, useEffect, useMemo, useReducer, ReactNode } from 'react';
import { SpotifyTrack, GuessAttempt, GameStatus, PlayerStats, GameContextValue } from '../types';
import { STEP_THRESHOLDS } from '../utils/audioTiming';
import useLocalStorage from '../hooks/useLocalStorage';

const DEFAULT_STATS: PlayerStats = {
  currentStreak: 0,
  maxStreak: 0,
  totalPlayed: 0,
  totalCorrect: 0,
  lightningCount: 0,
};

interface GameState {
  currentTrack: SpotifyTrack | null;
  currentStep: number;
  gameStatus: GameStatus;
  attempts: GuessAttempt[];
  isPlaying: boolean;
  currentTime: number;
  playedTrackIds: string[];
  volume: number;
}

type GameAction =
  | { type: 'START_GAME'; track: SpotifyTrack }
  | { type: 'SUBMIT_GUESS'; trackId: string }
  | { type: 'GIVE_UP' }
  | { type: 'NEXT_TRACK'; track: SpotifyTrack }
  | { type: 'RESTORE_GAME'; state: {
      currentTrack: SpotifyTrack;
      currentStep: number;
      gameStatus: GameStatus;
      attempts: GuessAttempt[];
      playedTrackIds: string[];
    }}
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'ADVANCE_STEP' }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_CURRENT_TIME'; currentTime: number };

const GameContext = createContext<GameContextValue | null>(null);

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        currentTrack: action.track,
        currentStep: 0,
        gameStatus: 'PLAYING',
        attempts: [],
        isPlaying: false,
        currentTime: 0,
      };
    case 'SUBMIT_GUESS': {
      const correct = state.currentTrack?.id === action.trackId;
      const attempt: GuessAttempt = {
        trackId: action.trackId,
        timestamp: Date.now(),
        correct,
        stepRevealed: STEP_THRESHOLDS[state.currentStep],
      };
      return {
        ...state,
        attempts: [...state.attempts, attempt],
        gameStatus: correct ? 'WON' : state.gameStatus,
        playedTrackIds: correct && state.currentTrack
          ? [...state.playedTrackIds, state.currentTrack.id]
          : state.playedTrackIds,
      };
    }
    case 'GIVE_UP':
      return {
        ...state,
        gameStatus: 'LOST',
        playedTrackIds: [],
      };
    case 'NEXT_TRACK':
      return {
        ...state,
        currentTrack: action.track,
        currentStep: 0,
        gameStatus: 'PLAYING',
        attempts: [],
        isPlaying: false,
        currentTime: 0,
      };
    case 'RESTORE_GAME':
      return {
        ...state,
        currentTrack: action.state.currentTrack,
        currentStep: action.state.currentStep,
        gameStatus: action.state.gameStatus,
        attempts: action.state.attempts,
        playedTrackIds: action.state.playedTrackIds,
        isPlaying: false,
        currentTime: 0,
      };
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.volume,
      };
    case 'ADVANCE_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, STEP_THRESHOLDS.length - 1),
      };
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.isPlaying,
      };
    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.currentTime,
      };
    default:
      return state;
  }
}

export function GameProvider({ children, tracks }: { children: ReactNode; tracks: SpotifyTrack[] }) {
  const [stats, setStats] = useLocalStorage<PlayerStats>('song_guess_stats', DEFAULT_STATS);

  const sanitizeStats = (s: Partial<PlayerStats>): PlayerStats => ({
    currentStreak: typeof s.currentStreak === 'number' && !isNaN(s.currentStreak) ? s.currentStreak : DEFAULT_STATS.currentStreak,
    maxStreak: typeof s.maxStreak === 'number' && !isNaN(s.maxStreak) ? s.maxStreak : DEFAULT_STATS.maxStreak,
    totalPlayed: typeof s.totalPlayed === 'number' && !isNaN(s.totalPlayed) ? s.totalPlayed : DEFAULT_STATS.totalPlayed,
    totalCorrect: typeof s.totalCorrect === 'number' && !isNaN(s.totalCorrect) ? s.totalCorrect : DEFAULT_STATS.totalCorrect,
    lightningCount: typeof s.lightningCount === 'number' && !isNaN(s.lightningCount) ? s.lightningCount : DEFAULT_STATS.lightningCount,
  });

  const normalizedStats = useMemo(() => sanitizeStats(stats), [stats]);

  const [state, dispatch] = useReducer(gameReducer, {
    currentTrack: null,
    currentStep: 0,
    gameStatus: 'PLAYING',
    attempts: [],
    isPlaying: false,
    currentTime: 0,
    playedTrackIds: [],
    volume: (() => {
      try {
        const saved = localStorage.getItem('song_guess_volume');
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
        }
      } catch {}
      return 0.5;
    })(),
  });

  const updateStats = (updater: (prev: PlayerStats) => PlayerStats) => {
    setStats(prev => updater(sanitizeStats(prev)));
  };

  const startNewGame = (track: SpotifyTrack) => {
    dispatch({ type: 'START_GAME', track });
  };

  const restoreGame = (gameState: {
    currentTrack: SpotifyTrack;
    currentStep: number;
    gameStatus: GameStatus;
    attempts: GuessAttempt[];
    playedTrackIds: string[];
  }) => {
    dispatch({ type: 'RESTORE_GAME', state: gameState });
  };

  const submitGuess = (trackId: string): boolean => {
    if (!state.currentTrack) return false;
    const correct = trackId === state.currentTrack.id;
    dispatch({ type: 'SUBMIT_GUESS', trackId });

    if (correct) {
      updateStats(prev => ({
        ...prev,
        currentStreak: prev.currentStreak + 1,
        totalCorrect: prev.totalCorrect + 1,
        totalPlayed: prev.totalPlayed + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        lightningCount: prev.lightningCount + (state.currentStep === 0 ? 1 : 0),
      }));
    }

    return correct;
  };

  const giveUp = () => {
    dispatch({ type: 'GIVE_UP' });
    updateStats(prev => ({
      ...prev,
      currentStreak: 0,
      totalPlayed: prev.totalPlayed + 1,
    }));
  };

  const nextTrack = () => {
    const available = tracks.filter(t =>
      t.id !== state.currentTrack?.id && !state.playedTrackIds.includes(t.id)
    );
    const pool = available.length > 0
      ? available
      : tracks.filter(t => t.id !== state.currentTrack?.id);
    const track = pool[Math.floor(Math.random() * pool.length)];
    if (track) {
      dispatch({ type: 'NEXT_TRACK', track });
    }
  };

  const advanceStep = () => {
    dispatch({ type: 'ADVANCE_STEP' });
  };

  const play = () => dispatch({ type: 'SET_PLAYING', isPlaying: true });
  const pause = () => dispatch({ type: 'SET_PLAYING', isPlaying: false });
  const setCurrentTime = (time: number) => dispatch({ type: 'SET_CURRENT_TIME', currentTime: time });

  const setVolume = (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    dispatch({ type: 'SET_VOLUME', volume: clamped });
    try {
      localStorage.setItem('song_guess_volume', String(clamped));
    } catch {}
  };

  const value: GameContextValue = {
    currentTrack: state.currentTrack,
    currentStep: state.currentStep,
    gameStatus: state.gameStatus,
    attempts: state.attempts,
    stats: normalizedStats,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    volume: state.volume,
    startNewGame,
    submitGuess,
    giveUp,
    nextTrack,
    restoreGame,
    advanceStep,
    play,
    pause,
    setCurrentTime,
    setVolume,
  };

  useEffect(() => {
    if (!state.currentTrack) return;
    try {
      const toSave = {
        currentTrack: state.currentTrack,
        currentStep: state.currentStep,
        gameStatus: state.gameStatus,
        attempts: state.attempts,
        playedTrackIds: state.playedTrackIds,
      };
      localStorage.setItem('song_guess_game_state', JSON.stringify(toSave));
    } catch {
      // ignore storage errors
    }
  }, [state.currentTrack, state.currentStep, state.gameStatus, state.attempts, state.playedTrackIds]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
