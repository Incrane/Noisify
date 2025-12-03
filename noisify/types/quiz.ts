// ============================================
// Noisify Live Quiz - TypeScript Types
// ============================================

// Quiz Categories
export const QUIZ_CATEGORIES = [
  'Allmänt',
  'Musik',
  'Sport',
  'Film & TV',
  'Vetenskap',
  'Historia',
  'Geografi',
  'Mat & Dryck',
  'Gaming',
  'Populärkultur',
  'Natur',
  'Teknik'
] as const;

export type QuizCategory = typeof QUIZ_CATEGORIES[number];

// Answer Option
export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

// Client-safe option (no isCorrect)
export type ClientQuizOption = Omit<QuizOption, 'isCorrect'>;

// Quiz Question
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  time_limit_seconds: number;
  order_index: number;
  options: QuizOption[];
  created_at: string;
}

// Quiz (Static Container)
export interface Quiz {
  id: string;
  org_id: string;
  created_by: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category: QuizCategory;
  is_public: boolean;
  cloned_from: string | null;
  created_at: string;
  updated_at: string;
}

// Quiz with related data
export interface QuizWithDetails extends Quiz {
  questions?: QuizQuestion[];
  question_count?: number;
  organization?: {
    id: string;
    org_namn: string;
    logo_url: string | null;
  };
  creator?: {
    id: string;
    alias: string;
  };
}

// Session Status
export type SessionStatus = 'LOBBY' | 'IN_PROGRESS' | 'SHOWING_RESULTS' | 'LEADERBOARD' | 'FINISHED';

// Session Access Policy
export type AccessPolicy = 'ORG_ONLY' | 'OPEN';

// Current Game State
export type GameState = 'WAITING_FOR_HOST' | 'COUNTDOWN' | 'QUESTION_ACTIVE' | 'SHOW_ANSWER' | 'SHOW_LEADERBOARD';

// Live Game Session
export interface QuizSession {
  id: string;
  quiz_id: string;
  org_id: string;
  host_id: string;
  pin_code: string;
  status: SessionStatus;
  access_policy: AccessPolicy;
  current_question_index: number;
  current_state: GameState;
  question_started_at: string | null;
  created_at: string;
  ended_at: string | null;
}

// Session with Quiz and Host info
export interface QuizSessionWithDetails extends QuizSession {
  quiz?: QuizWithDetails;
  host?: {
    id: string;
    alias: string;
  };
  organization?: {
    id: string;
    org_namn: string;
  };
  participant_count?: number;
}

// Participant in a Session
export interface QuizParticipant {
  id: string;
  session_id: string;
  profile_id: string | null;
  guest_name: string | null;
  nickname: string;
  score: number;
  streak: number;
  last_answer_at: string | null;
  joined_at: string;
}

// Participant Answer
export interface QuizAnswer {
  id: string;
  session_id: string;
  participant_id: string;
  question_index: number;
  selected_option: number;
  is_correct: boolean;
  time_taken_ms: number;
  points_earned: number;
  created_at: string;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  participant_id: string;
  nickname: string;
  score: number;
  streak: number;
  rank: number;
  previousRank?: number;
}

// Game Events for Realtime
export type GameEvent =
  | { type: 'PLAYER_JOINED'; participant: QuizParticipant }
  | { type: 'PLAYER_LEFT'; participant_id: string }
  | { type: 'GAME_STARTED' }
  | { type: 'QUESTION_START'; question_index: number; question: QuizQuestion }
  | { type: 'ANSWER_SUBMITTED'; participant_id: string; answer_index: number }
  | { type: 'QUESTION_END'; correct_option: number; answer_counts: number[] }
  | { type: 'LEADERBOARD_UPDATE'; leaderboard: LeaderboardEntry[] }
  | { type: 'GAME_ENDED'; final_leaderboard: LeaderboardEntry[] };

// Form data for creating/editing quiz
export interface QuizFormData {
  title: string;
  description: string;
  category: QuizCategory;
  cover_image_url?: string;
  is_public: boolean;
  questions: {
    question_text: string;
    time_limit_seconds: number;
    options: QuizOption[];
  }[];
}

// Host session settings
export interface HostSessionSettings {
  access_policy: AccessPolicy;
}

// Answer colors for the game UI
export const ANSWER_COLORS = {
  0: { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-white', icon: '▲' },
  1: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-white', icon: '◆' },
  2: { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', text: 'text-black', icon: '●' },
  3: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-white', icon: '■' }
} as const;

// Points calculation
export const calculatePoints = (isCorrect: boolean, timeTakenMs: number, timeLimitMs: number, currentStreak: number): number => {
  if (!isCorrect) return 0;

  // Base points: 1000
  const basePoints = 1000;

  // Time bonus: Up to 500 extra points for answering quickly
  const timeRatio = Math.max(0, 1 - (timeTakenMs / timeLimitMs));
  const timeBonus = Math.round(timeRatio * 500);

  // Streak bonus: 10% per streak level (max 50%)
  const streakMultiplier = Math.min(0.5, currentStreak * 0.1);
  const streakBonus = Math.round(basePoints * streakMultiplier);

  return basePoints + timeBonus + streakBonus;
};

// Generate 6-digit PIN code
export const generatePinCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
