export interface SpotifyTrack {
  id: string;
  name: string;
  primary_artist: string;
  preview_url: string;
  album_art: string;
  spotify_url: string;
  duration_ms: number;
}

export interface GuessAttempt {
  trackId: string | null;
  timestamp: number;
  correct: boolean;
  stepRevealed: number;
}

export type GameStatus = 'PLAYING' | 'WON' | 'LOST';

export interface PlayerStats {
  currentStreak: number;
  maxStreak: number;
  totalPlayed: number;
  totalCorrect: number;
}

export interface LocalStorageSchema {
  'song_guess_stats': PlayerStats;
}

export interface GameContextValue {
  currentTrack: SpotifyTrack | null;
  currentStep: number;
  gameStatus: GameStatus;
  attempts: GuessAttempt[];
  stats: PlayerStats;
  isPlaying: boolean;
  currentTime: number;
  startNewGame: (track: SpotifyTrack) => void;
  submitGuess: (trackId: string) => boolean;
  giveUp: () => void;
  nextTrack: () => void;
  advanceStep: () => void;
  play: () => void;
  pause: () => void;
  setCurrentTime: (time: number) => void;
}
