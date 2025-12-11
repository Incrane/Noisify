// =====================================================
// Tournament System TypeScript Types
// Generated: 2025-12-10
// =====================================================

// ===========================================
// Database Types
// ===========================================

export interface Season {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  point_config: PointConfig;
  registration_config: RegistrationConfig;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
}

export interface PlayerStats {
  id: string;
  season_id: string;
  profile_id: string;
  total_points: number;
  goals: number;
  assists: number;
  wins: number;
  losses: number;
  matches_played: number;
  badges: Badge[];
  status: 'active' | 'inactive' | 'suspended';
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface MatchDay {
  id: string;
  season_id: string;
  date: string;
  location: string | null;
  status: MatchDayStatus;
  rsvp_list: RSVPList;
  generated_teams: GeneratedTeam[];
  matches: Match[];
  match_duration_seconds: number;
  current_match_index: number | null;
  results: MatchResults;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Match {
  id: string;
  team_a_index: number;
  team_b_index: number;
  status: 'pending' | 'in_progress' | 'completed';
  score_a: number;
  score_b: number;
  time_remaining_seconds: number;
  is_paused: boolean;
  started_at: string | null;
  ended_at: string | null;
  winner_team_index: number | null;
}

export interface MatchEvent {
  id: string;
  match_day_id: string;
  match_id: string | null;
  profile_id: string;
  event_type: string;
  points_awarded: number;
  team_id: string | null;
  team_index: number | null;
  assisted_by: string | null;
  created_at: string;
  recorded_by: string | null;
}

// ===========================================
// Configuration Types
// ===========================================

export interface PointConfig {
  goal?: number;
  assist?: number;
  win?: number;
  loss?: number;
  [key: string]: number | undefined;
}

export interface RegistrationConfig {
  method: 'manual' | 'automatic';
  access?: 'open_for_all' | 'members_only' | 'selected_members';
  min_age?: number;
  max_age?: number;
  allowed_genders?: string[]; // UUIDs from gender table
  allowed_groups?: string[]; // UUIDs from target_subgroups table
}

export interface Badge {
  id: string;
  name: string;
  icon?: string;
  awarded_at: string;
}

// ===========================================
// Match Day Types
// ===========================================

export type MatchDayStatus =
  | 'open_for_rsvp'
  | 'rsvp_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface RSVPEntry {
  status: 'attending' | 'not_attending';
  checked_in?: boolean;
  checked_in_at?: string;
  updated_at?: string;
}

export interface RSVPList {
  [profile_id: string]: RSVPEntry;
}

export interface GeneratedTeam {
  id: string;
  name: string;
  color?: string; // Tailwind color class e.g. "bg-red-500"
  captain?: string; // profile_id
  players: string[]; // profile_ids
}

export interface MatchResults {
  [team_id: string]: {
    goals?: number;
    wins?: number;
    [key: string]: number | undefined;
  };
}

// ===========================================
// View Types
// ===========================================

export interface LeaderboardEntry {
  id: string;
  season_id: string;
  profile_id: string;
  alias: string;
  image_url: string | null;
  first_name: string | null;  // Only visible to staff
  last_name: string | null;   // Only visible to staff
  is_staff_viewer: boolean;   // Whether current user is staff
  total_points: number;
  goals: number;
  assists: number;
  wins: number;
  losses: number;
  matches_played: number;
  badges: Badge[];
  status: string;
  joined_at: string;
  rank: number;
  season_name: string;
  organization_id: string;
  organization_name: string;
}

export interface SeasonDashboard {
  season_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  point_config: PointConfig;
  registration_config: RegistrationConfig;
  starts_at: string | null;
  ends_at: string | null;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  created_at: string;
  created_by: string | null;
  created_by_alias: string | null;
  player_count: number;
  total_match_days: number;
  completed_match_days: number;
  next_match_day: string | null;
}

export interface MatchDayDetail {
  match_day_id: string;
  season_id: string;
  date: string;
  location: string | null;
  status: MatchDayStatus;
  rsvp_list: RSVPList;
  generated_teams: GeneratedTeam[];
  matches: Match[];
  match_duration_seconds: number;
  current_match_index: number | null;
  results: MatchResults;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  season_name: string;
  point_config: PointConfig;
  organization_id: string;
  attending_count: number;
  not_attending_count: number;
  checked_in_count: number;
  total_events: number;
}

// ===========================================
// API Response Types
// ===========================================

export interface TournamentResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface JoinTournamentResponse extends TournamentResponse {
  player_stats_id?: string;
}

export interface RecordEventResponse extends TournamentResponse {
  event_id?: string;
  points?: number;
}

export interface GenerateTeamsResponse extends TournamentResponse {
  teams?: GeneratedTeam[];
}

export interface EligibilityResponse {
  eligible: boolean;
  reason?: 'not_logged_in' | 'season_inactive' | 'already_registered' | 'manual_only' | 'validation_failed';
  message?: string;
  errors?: string[];
}

// ===========================================
// Form Types
// ===========================================

export interface CreateSeasonForm {
  name: string;
  description?: string;
  organization_id: string;
  point_config: PointConfig;
  registration_config: RegistrationConfig;
  starts_at?: string;
  ends_at?: string;
}

export interface CreateMatchDayForm {
  season_id: string;
  date: string;
  location?: string;
  notes?: string;
}

export interface UpdateSeasonForm extends Partial<CreateSeasonForm> {
  id: string;
  is_active?: boolean;
}

// ===========================================
// UI Component Props Types
// ===========================================

export interface SeasonCardProps {
  season: SeasonDashboard;
  showJoinButton?: boolean;
  onJoin?: () => void;
}

export interface LeaderboardTableProps {
  seasonId: string;
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export interface MatchDayCardProps {
  matchDay: MatchDayDetail;
  userRSVPStatus?: RSVPEntry;
  onRSVP?: (status: 'attending' | 'not_attending') => void;
}

export interface LiveScoringPanelProps {
  matchDay: MatchDayDetail;
  pointConfig: PointConfig;
  onRecordEvent: (profileId: string, eventType: string, teamId?: string) => void;
  onUndo: (eventId: string) => void;
}

// ===========================================
// Swedish Labels
// ===========================================

export const TOURNAMENT_LABELS = {
  // General
  tournament: 'Turnering',
  season: 'Säsong',
  seasons: 'Säsonger',
  leaderboard: 'Tabell',
  matchDay: 'Matchdag',
  matchDays: 'Matchdagar',

  // Actions
  join: 'Gå med',
  leave: 'Lämna',
  register: 'Anmäl dig',
  unregister: 'Avanmäl dig',
  contactStaff: 'Kontakta personalen',
  generateTeams: 'Generera lag',
  startMatch: 'Starta match',
  endMatch: 'Avsluta match',
  undo: 'Ångra',
  checkIn: 'Checka in',

  // Stats
  points: 'Poäng',
  goals: 'Mål',
  assists: 'Assist',
  wins: 'Vinster',
  losses: 'Förluster',
  matchesPlayed: 'Spelade matcher',
  players: 'Spelare',

  // Status
  active: 'Aktiv',
  inactive: 'Inaktiv',
  attending: 'Närvarande',
  notAttending: 'Ej närvarande',
  checkedIn: 'Incheckad',

  // Match Day Status
  openForRsvp: 'Öppen för närvaro',
  rsvpClosed: 'Närvaro stängd',
  inProgress: 'Pågår',
  completed: 'Avslutad',
  cancelled: 'Inställd',

  // Registration
  manual: 'Manuell',
  automatic: 'Automatisk',
  openForAll: 'Öppen för alla',
  membersOnly: 'Endast medlemmar',
  selectedMembers: 'Utvalda medlemmar',
  ageLimit: 'Åldersgräns',
  gender: 'Kön',
  targetGroups: 'Målgrupper',

  // Teams
  team: 'Lag',
  captain: 'Kapten',

  // Errors
  notLoggedIn: 'Du måste vara inloggad',
  alreadyRegistered: 'Du är redan registrerad',
  seasonInactive: 'Säsongen är inte aktiv',
  manualRegistration: 'Kontakta personalen för att gå med',
} as const;

export const MATCH_DAY_STATUS_LABELS: Record<MatchDayStatus, string> = {
  open_for_rsvp: TOURNAMENT_LABELS.openForRsvp,
  rsvp_closed: TOURNAMENT_LABELS.rsvpClosed,
  in_progress: TOURNAMENT_LABELS.inProgress,
  completed: TOURNAMENT_LABELS.completed,
  cancelled: TOURNAMENT_LABELS.cancelled,
};
