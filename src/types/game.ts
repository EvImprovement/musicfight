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
  user_id?: string;
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
  type: 'playlist' | 'artist' | 'chart' | 'album' | 'mixed';
  deezerId?: number | string;
  secondaryDeezerId?: number | string;
  extraDeezerIds?: (number | string)[];
  combinedThemes?: CategoryTheme[];
  query?: string;
  coverUrl?: string;
  color: string;
  badge?: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  streak: number;
  avatar: string;
  isReady?: boolean;
  isLockedOut?: boolean;
  lastPoints?: number;
}

export type RoomGameplayMode = 'buzzer' | 'everyone';

export interface RoomSettings {
  themeId: string;
  themeName: string;
  themeIcon: string;
  themeColor: string;
  themeIds?: string[];
  themeType?: 'playlist' | 'artist' | 'chart' | 'album' | 'mixed';
  albumId?: number | string;
  albumArtist?: string;
  albumCover?: string;
  albums?: { id: number | string; title: string; artistName: string; cover?: string }[];
  artists?: { id: number | string; name: string; picture?: string; nb_fans?: number }[];
  trackCount: number;
  timePerTrack: number;
  gameplayMode: RoomGameplayMode;
}

export type RoomBroadcastEvent =
  | { type: 'SETTINGS_UPDATE'; settings: RoomSettings }
  | {
      type: 'GAME_STARTING';
      settings: RoomSettings;
      tracks: Track[];
      distractorPool: Track[];
      startTimestamp: number;
      initialQuestion?: {
        questionIndex: number;
        startTime: number;
        correctOptionId: string | number;
        correctOption: Option;
        options: Option[];
      };
    }
  | { type: 'QUESTION_START'; questionIndex: number; startTime: number; correctOptionId: string | number; options: Option[] }
  | { type: 'PLAYER_BUZZ'; playerId: string; playerName: string; optionId: string | number; responseTimeMs: number }
  | { type: 'ROUND_RESULT'; winnerPlayerId?: string; winnerName?: string; pointsGained: number; correctOption: Option; track: Track; updatedScores: Record<string, number> }
  | { type: 'SHOW_SCOREBOARD'; updatedScores: Record<string, number> }
  | { type: 'GAME_OVER'; finalRankings: RoomPlayer[] }
  | { type: 'RETURN_TO_LOBBY' };

