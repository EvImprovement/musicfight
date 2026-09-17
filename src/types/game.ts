export interface Track {
  id: number | string;
  title: string;
  artist: {
    id: number | string;
    name: string;
    picture_medium?: string;
  };
  album: {
    id: number | string;
    title: string;
    cover_medium?: string;
    cover_big?: string;
  };
  preview: string; // 30-sec MP3 URL
  duration?: number;
}

export interface Option {
  id: string | number;
  title: string;
  artistName: string;
  albumCover?: string;
  isTrackTitle: boolean;
}

export type GameModeType = 'classic' | 'timeattack' | 'survival' | 'multiplayer';

export interface GameSettings {
  mode: GameModeType;
  trackCount: number; // default 10
  timePerTrack: number; // in seconds, default 15
  playerNames?: string[]; // for local multiplayer
}

export interface QuestionResult {
  track: Track;
  userAnswer?: Option;
  correctOption: Option;
  isCorrect: boolean;
  scoreGained: number;
  responseTimeMs: number;
}

export interface LocalPlayerState {
  name: string;
  score: number;
  streak: number;
  lives?: number;
}

export interface GameStats {
  score: number;
  correctCount: number;
  totalQuestions: number;
  maxStreak: number;
  averageResponseTimeMs: number;
  history: QuestionResult[];
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  accuracy: number;
  mode: GameModeType;
  category_name: string;
  created_at: string;
}

export interface CategoryTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'playlist' | 'artist' | 'chart';
  deezerId?: number | string;
  query?: string;
  coverUrl?: string;
  color: string;
}
