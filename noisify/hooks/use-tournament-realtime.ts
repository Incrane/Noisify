"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Hook for real-time leaderboard updates
 * Subscribes to: t_player_stats, t_match_events
 */
export function useLeaderboardRealtime(
  seasonId: string,
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!seasonId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`leaderboard:${seasonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_player_stats",
          filter: `season_id=eq.${seasonId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_match_events",
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId]);
}

/**
 * Hook for real-time match day updates (RSVP, check-ins, teams, matches)
 * Subscribes to: t_match_days (UPDATE), t_match_events
 */
export function useMatchDayRealtime(
  matchDayId: string,
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!matchDayId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`matchday:${matchDayId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_match_days",
          filter: `id=eq.${matchDayId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_match_events",
          filter: `match_day_id=eq.${matchDayId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchDayId]);
}

/**
 * Hook for real-time season dashboard updates
 * Subscribes to: t_seasons, t_player_stats, t_match_days
 */
export function useSeasonDashboardRealtime(
  seasonId: string,
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!seasonId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`season:${seasonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_seasons",
          filter: `id=eq.${seasonId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_player_stats",
          filter: `season_id=eq.${seasonId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_match_days",
          filter: `season_id=eq.${seasonId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId]);
}

/**
 * Hook for real-time tournament list updates
 * Subscribes to: t_seasons (all)
 */
export function useTournamentListRealtime(onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel("tournaments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_seasons",
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

/**
 * Hook for real-time active match updates
 * Used in ActiveMatchView for live scoring
 * Subscribes to: t_match_days (for timer/match state), t_match_events (for scoring)
 */
export function useActiveMatchRealtime(
  matchDayId: string,
  onMatchUpdate: () => void,
  onEventUpdate: () => void
) {
  const onMatchUpdateRef = useRef(onMatchUpdate);
  const onEventUpdateRef = useRef(onEventUpdate);
  
  useEffect(() => {
    onMatchUpdateRef.current = onMatchUpdate;
    onEventUpdateRef.current = onEventUpdate;
  });

  useEffect(() => {
    if (!matchDayId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`active-match:${matchDayId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "t_match_days",
          filter: `id=eq.${matchDayId}`,
        },
        () => {
          onMatchUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "t_match_events",
          filter: `match_day_id=eq.${matchDayId}`,
        },
        () => {
          onEventUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "t_match_events",
          filter: `match_day_id=eq.${matchDayId}`,
        },
        () => {
          onEventUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchDayId]);
}

/**
 * Hook for real-time player stats updates (for participant view)
 * Subscribes to: t_player_stats for specific profile
 */
export function usePlayerStatsRealtime(
  profileId: string,
  seasonId: string,
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!profileId || !seasonId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`player-stats:${profileId}:${seasonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "t_player_stats",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, seasonId]);
}
