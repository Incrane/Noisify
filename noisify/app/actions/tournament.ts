"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Season,
  PlayerStats,
  MatchDay,
  MatchEvent,
  SeasonDashboard,
  LeaderboardEntry,
  MatchDayDetail,
  CreateSeasonForm,
  CreateMatchDayForm,
  TournamentResponse,
  JoinTournamentResponse,
  RecordEventResponse,
  GenerateTeamsResponse,
  EligibilityResponse,
  GeneratedTeam,
} from "@/types/tournament";

// =====================================================
// SEASON ACTIONS
// =====================================================

/**
 * Get all seasons for an organization
 */
export async function getSeasons(orgId: string): Promise<SeasonDashboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_season_dashboard")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching seasons:", error);
    return [];
  }
  return data || [];
}

/**
 * Get active seasons for an organization (public view)
 */
export async function getActiveSeasons(orgId: string): Promise<SeasonDashboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_season_dashboard")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active seasons:", error);
    return [];
  }
  return data || [];
}

/**
 * Get all public active seasons (for browse page)
 */
export async function getPublicSeasons(orgId?: string): Promise<SeasonDashboard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("t_season_dashboard")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching public seasons:", error);
    return [];
  }
  return data || [];
}

/**
 * Get user's tournament registrations
 */
export async function getUserTournaments(): Promise<SeasonDashboard[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return [];

  // Get seasons where user is registered
  const { data: playerStats } = await supabase
    .from("t_player_stats")
    .select("season_id")
    .eq("profile_id", profile.id);

  if (!playerStats || playerStats.length === 0) return [];

  const seasonIds = playerStats.map(p => p.season_id);

  const { data, error } = await supabase
    .from("t_season_dashboard")
    .select("*")
    .in("season_id", seasonIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user tournaments:", error);
    return [];
  }
  return data || [];
}

/**
 * Get a single season by ID
 */
export async function getSeason(seasonId: string): Promise<SeasonDashboard | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_season_dashboard")
    .select("*")
    .eq("season_id", seasonId)
    .single();

  if (error) {
    console.error("Error fetching season:", error);
    return null;
  }
  return data;
}

/**
 * Create a new season
 */
export async function createSeason(form: CreateSeasonForm): Promise<TournamentResponse & { season_id?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Du måste vara inloggad" };
  }

  // Get profile_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profil saknas" };
  }

  const { data, error } = await supabase
    .from("t_seasons")
    .insert({
      name: form.name,
      description: form.description || null,
      organization_id: form.organization_id,
      point_config: form.point_config,
      registration_config: form.registration_config,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating season:", error);
    return { success: false, error: "Kunde inte skapa säsong" };
  }

  revalidatePath("/staff/tournament");
  return { success: true, message: "Säsong skapad!", season_id: data.id };
}

/**
 * Update a season
 */
export async function updateSeason(
  seasonId: string,
  updates: Partial<Season>
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("t_seasons")
    .update(updates)
    .eq("id", seasonId);

  if (error) {
    console.error("Error updating season:", error);
    return { success: false, error: "Kunde inte uppdatera säsong" };
  }

  revalidatePath("/staff/tournament");
  revalidatePath(`/staff/tournament/${seasonId}`);
  return { success: true, message: "Säsong uppdaterad!" };
}

/**
 * Delete a season
 */
export async function deleteSeason(seasonId: string): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("t_seasons")
    .delete()
    .eq("id", seasonId);

  if (error) {
    console.error("Error deleting season:", error);
    return { success: false, error: "Kunde inte ta bort säsong" };
  }

  revalidatePath("/staff/tournament");
  return { success: true, message: "Säsong borttagen!" };
}

// =====================================================
// PLAYER STATS / REGISTRATION ACTIONS
// =====================================================

/**
 * Get leaderboard for a season (security: only registered users or staff can view)
 */
export async function getLeaderboard(seasonId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Try secure RPC function first
  const { data, error } = await supabase.rpc("get_season_leaderboard", {
    p_season_id: seasonId,
  });

  if (error) {
    // If RPC fails, fall back to direct query (for staff or if RPC not applied)
    console.log("RPC failed, falling back to direct query:", error.message);
    return getLeaderboardDirect(seasonId);
  }

  // Map RPC result to LeaderboardEntry format
  return (data || []).map((row: {
    rank: number;
    profile_id: string;
    alias: string;
    image_url: string | null;
    first_name: string | null;
    last_name: string | null;
    is_staff_viewer: boolean;
    total_points: number;
    goals: number;
    assists: number;
    wins: number;
    losses: number;
    matches_played: number;
    status: string;
  }) => ({
    rank: row.rank,
    profile_id: row.profile_id,
    alias: row.alias,
    image_url: row.image_url,
    first_name: row.first_name,
    last_name: row.last_name,
    is_staff_viewer: row.is_staff_viewer,
    total_points: row.total_points,
    goals: row.goals,
    assists: row.assists,
    wins: row.wins,
    losses: row.losses,
    matches_played: row.matches_played,
    status: row.status,
    season_id: seasonId,
    season_name: "",
    organization_id: "",
    organization_name: "",
    id: row.profile_id,
    badges: [],
    joined_at: "",
  }));
}

/**
 * Direct leaderboard query (fallback for staff or when RPC not available)
 */
async function getLeaderboardDirect(seasonId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("t_player_stats")
    .select(`
      id,
      profile_id,
      total_points,
      goals,
      assists,
      wins,
      losses,
      matches_played,
      status,
      joined_at,
      profiles:profile_id (
        alias,
        image_url,
        users_private!left(first_name, last_name)
      )
    `)
    .eq("season_id", seasonId)
    .eq("status", "active")
    .order("total_points", { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard direct:", error);
    return [];
  }

  return (data || []).map((row, index) => {
    const profile = row.profiles as unknown as {
      alias: string;
      image_url: string | null;
      users_private: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[] | null;
    } | null;
    const privateData = profile?.users_private
      ? (Array.isArray(profile.users_private) ? profile.users_private[0] : profile.users_private)
      : null;

    return {
      id: row.id,
      rank: index + 1,
      profile_id: row.profile_id,
      alias: profile?.alias || "Okänd",
      image_url: profile?.image_url || null,
      first_name: privateData?.first_name || null,
      last_name: privateData?.last_name || null,
      is_staff_viewer: true, // Assume staff if using direct query
      total_points: row.total_points,
      goals: row.goals,
      assists: row.assists,
      wins: row.wins,
      losses: row.losses,
      matches_played: row.matches_played,
      status: row.status,
      season_id: seasonId,
      season_name: "",
      organization_id: "",
      organization_name: "",
      badges: [],
      joined_at: row.joined_at,
    };
  });
}

/**
 * Get all players in a season (for staff)
 */
export async function getSeasonPlayers(seasonId: string): Promise<PlayerStats[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_player_stats")
    .select(`
      *,
      profiles:profile_id (
        alias,
        image_url
      )
    `)
    .eq("season_id", seasonId)
    .order("total_points", { ascending: false });

  if (error) {
    console.error("Error fetching players:", error);
    return [];
  }
  return data || [];
}

/**
 * Check if current user is registered in a season
 */
export async function isUserRegistered(seasonId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return false;

  const { data } = await supabase
    .from("t_player_stats")
    .select("id")
    .eq("season_id", seasonId)
    .eq("profile_id", profile.id)
    .single();

  return !!data;
}

/**
 * Check eligibility to join a tournament (calls RPC)
 */
export async function checkEligibility(seasonId: string): Promise<EligibilityResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_tournament_eligibility", {
    p_season_id: seasonId,
  });

  if (error) {
    console.error("Error checking eligibility:", error);
    return { eligible: false, reason: "validation_failed", message: "Kunde inte kontrollera behörighet" };
  }

  return data as EligibilityResponse;
}

/**
 * Join a tournament season (calls RPC)
 */
export async function joinSeason(seasonId: string): Promise<JoinTournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("join_tournament_season", {
    p_season_id: seasonId,
  });

  if (error) {
    console.error("Error joining season:", error);
    return { success: false, error: "Kunde inte gå med i turneringen" };
  }

  revalidatePath(`/app/tournament/${seasonId}`);
  return data as JoinTournamentResponse;
}

/**
 * Leave a tournament season
 */
export async function leaveSeason(seasonId: string): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Du måste vara inloggad" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profil saknas" };
  }

  const { error } = await supabase
    .from("t_player_stats")
    .delete()
    .eq("season_id", seasonId)
    .eq("profile_id", profile.id);

  if (error) {
    console.error("Error leaving season:", error);
    return { success: false, error: "Kunde inte lämna turneringen" };
  }

  revalidatePath(`/app/tournament/${seasonId}`);
  return { success: true, message: "Du har lämnat turneringen" };
}

/**
 * Add a player to a season (staff action)
 */
export async function addPlayerToSeason(
  seasonId: string,
  profileId: string
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("t_player_stats")
    .insert({
      season_id: seasonId,
      profile_id: profileId,
    });

  if (error) {
    console.error("Error adding player:", error);
    if (error.code === "23505") {
      return { success: false, error: "Spelaren är redan registrerad" };
    }
    return { success: false, error: "Kunde inte lägga till spelare" };
  }

  revalidatePath(`/staff/tournament/${seasonId}`);
  return { success: true, message: "Spelare tillagd!" };
}

/**
 * Remove a player from a season (staff action)
 */
export async function removePlayerFromSeason(
  seasonId: string,
  profileId: string
): Promise<TournamentResponse> {
  console.log("[removePlayerFromSeason] Starting delete for seasonId:", seasonId, "profileId:", profileId);
  const supabase = await createClient();

  // First verify the user is authenticated and has staff access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Du måste vara inloggad" };
  }

  // Get user's profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!userProfile) {
    return { success: false, error: "Profil saknas" };
  }

  // Get season's organization and verify staff access
  const { data: season } = await supabase
    .from("t_seasons")
    .select("organization_id")
    .eq("id", seasonId)
    .single();

  if (!season) {
    return { success: false, error: "Säsongen hittades inte" };
  }

  // Check if user is staff (role_id >= 2) for this season's organization
  const { data: orgUser } = await supabase
    .from("org_user")
    .select("role_id")
    .eq("profile_id", userProfile.id)
    .eq("org_id", season.organization_id)
    .gte("role_id", 2)
    .maybeSingle();

  if (!orgUser) {
    return { success: false, error: "Du har inte behörighet att ta bort spelare från denna turnering" };
  }

  // First check if the player exists
  const { data: existingPlayer, error: checkError } = await supabase
    .from("t_player_stats")
    .select("id")
    .eq("season_id", seasonId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking player:", checkError);
    return { success: false, error: "Kunde inte kontrollera spelare" };
  }

  if (!existingPlayer) {
    return { success: false, error: "Spelaren hittades inte i turneringen" };
  }

  // Use admin client to bypass RLS for the delete (we've verified staff access above)
  const { createAdminClient } = await import("@/utils/supabase/server");
  const adminClient = await createAdminClient();

  const { error, count } = await adminClient
    .from("t_player_stats")
    .delete({ count: 'exact' })
    .eq("season_id", seasonId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error removing player:", error);
    return { success: false, error: "Kunde inte ta bort spelare" };
  }

  console.log("[removePlayerFromSeason] Deleted", count, "rows");

  if (count === 0) {
    return { success: false, error: "Spelaren kunde inte tas bort" };
  }

  revalidatePath(`/staff/tournament/${seasonId}`);
  revalidatePath(`/staff/tournament/${seasonId}/spelarstatistik`);
  return { success: true, message: "Spelare borttagen!" };
}

// =====================================================
// MATCH DAY ACTIONS
// =====================================================

/**
 * Get all match days for a season
 */
export async function getMatchDays(seasonId: string): Promise<MatchDayDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_match_day_detail")
    .select("*")
    .eq("season_id", seasonId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching match days:", error);
    return [];
  }
  return data || [];
}

/**
 * Get a single match day
 */
export async function getMatchDay(matchDayId: string): Promise<MatchDayDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_match_day_detail")
    .select("*")
    .eq("match_day_id", matchDayId)
    .single();

  if (error) {
    console.error("Error fetching match day:", error);
    return null;
  }
  return data;
}

/**
 * Create a new match day
 */
export async function createMatchDay(form: CreateMatchDayForm): Promise<TournamentResponse & { match_day_id?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Du måste vara inloggad" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profil saknas" };
  }

  const { data, error } = await supabase
    .from("t_match_days")
    .insert({
      season_id: form.season_id,
      date: form.date,
      location: form.location || null,
      notes: form.notes || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating match day:", error);
    return { success: false, error: "Kunde inte skapa matchdag" };
  }

  revalidatePath(`/staff/tournament/${form.season_id}/matchdagar`);
  return { success: true, message: "Matchdag skapad!", match_day_id: data.id };
}

/**
 * Update match day status
 */
export async function updateMatchDayStatus(
  matchDayId: string,
  status: MatchDay["status"]
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("t_match_days")
    .update({ status })
    .eq("id", matchDayId);

  if (error) {
    console.error("Error updating match day status:", error);
    return { success: false, error: "Kunde inte uppdatera status" };
  }

  revalidatePath(`/staff/tournament`);
  return { success: true, message: "Status uppdaterad!" };
}

/**
 * Delete a match day
 */
export async function deleteMatchDay(matchDayId: string, seasonId: string): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("t_match_days")
    .delete()
    .eq("id", matchDayId);

  if (error) {
    console.error("Error deleting match day:", error);
    return { success: false, error: "Kunde inte ta bort matchdag" };
  }

  revalidatePath(`/staff/tournament/${seasonId}/matchdagar`);
  return { success: true, message: "Matchdag borttagen!" };
}

/**
 * Update RSVP status (calls RPC)
 */
export async function updateRSVP(
  matchDayId: string,
  status: "attending" | "not_attending"
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_match_rsvp", {
    p_match_day_id: matchDayId,
    p_status: status,
  });

  if (error) {
    console.error("Error updating RSVP:", error);
    return { success: false, error: "Kunde inte uppdatera närvaro" };
  }

  revalidatePath(`/app/tournament`);
  return data as TournamentResponse;
}

/**
 * Check in a player (calls RPC)
 */
export async function checkInPlayer(
  matchDayId: string,
  profileId: string
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_in_player", {
    p_match_day_id: matchDayId,
    p_profile_id: profileId,
  });

  if (error) {
    console.error("Error checking in player:", error);
    return { success: false, error: "Kunde inte checka in spelare" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse;
}

/**
 * Generate teams using snake draft (calls RPC)
 */
export async function generateTeams(
  matchDayId: string,
  numTeams: number = 4
): Promise<GenerateTeamsResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_snake_draft_teams", {
    p_match_day_id: matchDayId,
    p_num_teams: numTeams,
  });

  if (error) {
    console.error("Error generating teams:", error);
    return { success: false, error: "Kunde inte generera lag" };
  }

  revalidatePath(`/staff/tournament`);

  // Auto-generate matches after teams are created
  if (data?.success) {
    await generateMatches(matchDayId);
  }

  return data as GenerateTeamsResponse;
}

/**
 * Generate matches for teams (round-robin)
 */
export async function generateMatches(matchDayId: string): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_matches_for_teams", {
    p_match_day_id: matchDayId,
  });

  if (error) {
    console.error("Error generating matches:", error);
    return { success: false, error: "Kunde inte generera matcher" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse;
}

/**
 * Update teams (rename, reorder, change colors, move players)
 */
export async function updateTeams(
  matchDayId: string,
  teams: GeneratedTeam[]
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("t_match_days")
    .update({ generated_teams: teams })
    .eq("id", matchDayId);

  if (error) {
    console.error("Error updating teams:", error);
    return { success: false, error: "Kunde inte uppdatera lag" };
  }

  revalidatePath(`/staff/tournament`);
  return { success: true, message: "Lag uppdaterade" };
}

/**
 * Start a match
 */
export async function startMatch(
  matchDayId: string,
  matchIndex: number
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("start_match", {
    p_match_day_id: matchDayId,
    p_match_index: matchIndex,
  });

  if (error) {
    console.error("Error starting match:", error);
    return { success: false, error: "Kunde inte starta match" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse;
}

/**
 * Toggle pause/resume on active match
 */
export async function toggleMatchPause(matchDayId: string): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("toggle_match_pause", {
    p_match_day_id: matchDayId,
  });

  if (error) {
    console.error("Error toggling match pause:", error);
    return { success: false, error: "Kunde inte pausa/fortsätta match" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse;
}

/**
 * Update match timer (called periodically from client)
 */
export async function syncMatchTimer(
  matchDayId: string,
  timeRemaining: number
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_match_timer", {
    p_match_day_id: matchDayId,
    p_time_remaining: timeRemaining,
  });

  if (error) {
    // Don't log timer sync errors - they happen often
    return { success: false, error: "Kunde inte synka timer" };
  }

  return data as TournamentResponse;
}

/**
 * End the current match and award points
 */
export async function endMatch(matchDayId: string): Promise<TournamentResponse & {
  winner_team_index?: number | null;
  score_a?: number;
  score_b?: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("end_match", {
    p_match_day_id: matchDayId,
  });

  if (error) {
    console.error("Error ending match:", error);
    return { success: false, error: "Kunde inte avsluta match" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse & { winner_team_index?: number | null; score_a?: number; score_b?: number };
}

/**
 * Record event during active match (goal, assist, etc.)
 */
export async function recordMatchEvent(
  matchDayId: string,
  profileId: string,
  eventType: string,
  teamIndex: number
): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("record_match_event", {
    p_match_day_id: matchDayId,
    p_profile_id: profileId,
    p_event_type: eventType,
    p_team_index: teamIndex,
  });

  if (error) {
    console.error("Error recording match event:", error);
    return { success: false, error: "Kunde inte registrera händelse" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse;
}

// =====================================================
// MATCH EVENT / SCORING ACTIONS (LEGACY)
// =====================================================

/**
 * Get all events for a match day
 */
export async function getMatchEvents(matchDayId: string): Promise<MatchEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("t_match_events")
    .select(`
      *,
      profiles:profile_id (
        alias,
        image_url
      ),
      assister:assisted_by (
        alias
      )
    `)
    .eq("match_day_id", matchDayId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching match events:", error);
    return [];
  }
  return data || [];
}

/**
 * Record a match event (calls RPC)
 */
export async function recordEvent(
  matchDayId: string,
  profileId: string,
  eventType: string,
  teamId?: string,
  assistedBy?: string
): Promise<RecordEventResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("record_match_event", {
    p_match_day_id: matchDayId,
    p_profile_id: profileId,
    p_event_type: eventType,
    p_team_id: teamId || null,
    p_assisted_by: assistedBy || null,
  });

  if (error) {
    console.error("Error recording event:", error);
    return { success: false, error: "Kunde inte registrera händelse" };
  }

  revalidatePath(`/staff/tournament`);
  return data as RecordEventResponse;
}

/**
 * Undo a match event (calls RPC)
 */
export async function undoEvent(eventId: string): Promise<TournamentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("undo_match_event", {
    p_event_id: eventId,
  });

  if (error) {
    console.error("Error undoing event:", error);
    return { success: false, error: "Kunde inte ångra händelse" };
  }

  revalidatePath(`/staff/tournament`);
  return data as TournamentResponse;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Search members for inviting to tournament
 */
export async function searchMembersForTournament(
  orgId: string,
  query: string
): Promise<{ id: string; alias: string; image_url: string | null; first_name?: string; last_name?: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, 
      alias, 
      image_url,
      users_private!left(first_name, last_name)
    `)
    .ilike("alias", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching members:", error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    alias: p.alias,
    image_url: p.image_url,
    first_name: (p.users_private as { first_name?: string } | null)?.first_name,
    last_name: (p.users_private as { last_name?: string } | null)?.last_name,
  }));
}

/**
 * Get organization members for tournament (with names for staff)
 */
export async function getOrganizationMembersForTournament(
  orgId: string
): Promise<{ id: string; alias: string; image_url: string | null; first_name?: string; last_name?: string }[]> {
  const supabase = await createClient();

  // Get members of the organization via memberships
  const { data, error } = await supabase
    .from("memberships")
    .select(`
      profile_id,
      profiles!inner(
        id,
        alias,
        image_url,
        users_private!left(first_name, last_name),
        local_members!left(first_name, last_name)
      )
    `)
    .eq("org_id", orgId)
    .eq("membership_state", "active")
    .limit(1000); // Higher limit for client-side filtering

  if (error) {
    console.error("Error fetching org members:", error);
    return [];
  }

  return (data || []).map((m) => {
    const profile = m.profiles as unknown as {
      id: string;
      alias: string;
      image_url: string | null;
      users_private: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[] | null;
      local_members: { first_name?: string; last_name?: string }[] | null;
    };

    // Handle users_private (could be array or object depending on relation, usually object if 1-1)
    const privateData = Array.isArray(profile.users_private)
      ? profile.users_private[0]
      : profile.users_private;

    // Handle local_members (array because 1-many relation by default unless unique constraint)
    const localData = Array.isArray(profile.local_members)
      ? profile.local_members[0]
      : profile.local_members;

    return {
      id: profile.id,
      alias: profile.alias,
      image_url: profile.image_url,
      first_name: privateData?.first_name || localData?.first_name,
      last_name: privateData?.last_name || localData?.last_name,
    };
  });
}

/**
 * Staff adds player to match day RSVP (as attending)
 */
export async function staffAddPlayerToMatchDay(
  matchDayId: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update match day rsvp_list to add the player as attending
  const { data: matchDay, error: fetchError } = await supabase
    .from("t_match_days")
    .select("rsvp_list")
    .eq("id", matchDayId)
    .single();

  if (fetchError) {
    return { success: false, error: "Kunde inte hitta matchdagen" };
  }

  const rsvpList = (matchDay?.rsvp_list as Record<string, unknown>) || {};
  rsvpList[profileId] = {
    status: "attending",
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("t_match_days")
    .update({ rsvp_list: rsvpList, updated_at: new Date().toISOString() })
    .eq("id", matchDayId);

  if (updateError) {
    return { success: false, error: "Kunde inte lägga till spelaren" };
  }

  return { success: true };
}

/**
 * Get user's tournament stats across all seasons
 */
export async function getUserTournamentStats(profileId: string): Promise<PlayerStats[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("t_player_stats")
    .select(`
      *,
      season:season_id (
        name,
        organization_id
      )
    `)
    .eq("profile_id", profileId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching user stats:", error);
    return [];
  }

  return data || [];
}

/**
 * Get available genders for registration config
 */
export async function getGenders(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gender")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching genders:", error);
    return [];
  }

  return data || [];
}

/**
 * Get available target subgroups for registration config
 */
export async function getTargetSubgroups(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("target_subgroups")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching target subgroups:", error);
    return [];
  }

  return data || [];
}
