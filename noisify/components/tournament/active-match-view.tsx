"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Match, GeneratedTeam, PlayerStats, PointConfig } from "@/types/tournament";
import { 
  toggleMatchPause, 
  endMatch, 
  recordMatchEvent,
  syncMatchTimer,
} from "@/app/actions/tournament";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActiveMatchViewProps {
  matchDayId: string;
  match: Match;
  teams: GeneratedTeam[];
  players: PlayerStats[];
  pointConfig: PointConfig;
  onMatchEnd: (result: { winner_team_index: number | null; score_a: number; score_b: number }) => void;
  onDataRefresh: () => void;
}

export function ActiveMatchView({
  matchDayId,
  match,
  teams,
  players,
  pointConfig,
  onMatchEnd,
  onDataRefresh,
}: ActiveMatchViewProps) {
  const [timeRemaining, setTimeRemaining] = useState(match.time_remaining_seconds);
  const [isPaused, setIsPaused] = useState(match.is_paused);
  const [localScoreA, setLocalScoreA] = useState(match.score_a);
  const [localScoreB, setLocalScoreB] = useState(match.score_b);
  
  const teamA = teams[match.team_a_index];
  const teamB = teams[match.team_b_index];

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = async () => {
    const result = await toggleMatchPause(matchDayId);
    if (result.success) {
      setIsPaused(!isPaused);
      toast.success(isPaused ? "Match fortsätter" : "Match pausad");
    } else {
      toast.error(result.error);
    }
  };

  const handleEndMatch = useCallback(async () => {
    const result = await endMatch(matchDayId);
    if (result.success) {
      toast.success("Match avslutad!");
      onMatchEnd({
        winner_team_index: result.winner_team_index ?? null,
        score_a: result.score_a ?? localScoreA,
        score_b: result.score_b ?? localScoreB,
      });
    } else {
      toast.error(result.error);
    }
  }, [matchDayId, localScoreA, localScoreB, onMatchEnd]);

  // Countdown timer
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Sync to server every 10 seconds
        if (newTime % 10 === 0 && newTime > 0) {
          syncMatchTimer(matchDayId, newTime);
        }
        
        // Auto-end match when timer reaches 0
        if (newTime <= 0) {
          handleEndMatch();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, matchDayId, handleEndMatch]);

  // Sync with server state
  useEffect(() => {
    setTimeRemaining(match.time_remaining_seconds);
    setIsPaused(match.is_paused);
    setLocalScoreA(match.score_a);
    setLocalScoreB(match.score_b);
  }, [match]);

  const handleRecordEvent = async (profileId: string, eventType: string, teamIndex: number) => {
    const result = await recordMatchEvent(matchDayId, profileId, eventType, teamIndex);
    if (result.success) {
      // Optimistic update for score
      if (eventType === 'goal') {
        if (teamIndex === match.team_a_index) {
          setLocalScoreA(prev => prev + 1);
        } else {
          setLocalScoreB(prev => prev + 1);
        }
      }
      toast.success(`${eventType === 'goal' ? 'Mål' : 'Assist'} registrerat!`);
      onDataRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const getPlayerProfile = (playerId: string) => {
    const player = players.find(p => p.profile_id === playerId);
    return (player as { profiles?: { alias?: string; image_url?: string } })?.profiles;
  };

  // Get dynamic event buttons from point config (excluding win/loss)
  const eventButtons = Object.entries(pointConfig)
    .filter(([key]) => !['win', 'loss'].includes(key))
    .map(([key, points]) => ({
      type: key,
      label: key === 'goal' ? 'Mål' : key === 'assist' ? 'Assist' : key,
      points: points || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          {/* Teams and Score */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold">Lag {match.team_a_index + 1}</div>
              <div className="text-5xl font-bold my-2">{localScoreA}</div>
            </div>
            <div className="text-2xl font-light opacity-75">vs</div>
            <div className="text-center">
              <div className="text-xl font-bold">Lag {match.team_b_index + 1}</div>
              <div className="text-5xl font-bold my-2">{localScoreB}</div>
            </div>
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className={cn(
              "text-6xl font-mono font-bold mb-4",
              timeRemaining <= 30 && "text-red-300 animate-pulse"
            )}>
              {formatTime(timeRemaining)}
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleTogglePause}
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Fortsätt
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pausa
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndMatch}
                className="gap-2"
              >
                <Square className="w-5 h-5" />
                Avsluta match
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Panels */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team A */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Lag {match.team_a_index + 1}
              <Badge variant="outline" className="ml-auto">
                {localScoreA} mål
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(teamA?.players || []).map((playerId: string) => {
              const profile = getPlayerProfile(playerId);
              return (
                <div key={playerId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.image_url} />
                    <AvatarFallback className="bg-slate-200">
                      {profile?.alias?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 font-medium text-slate-900">
                    {profile?.alias || "Okänd"}
                  </div>
                  <div className="flex gap-2">
                    {eventButtons.map((btn) => (
                      <Button
                        key={btn.type}
                        size="sm"
                        variant={btn.type === 'goal' ? 'default' : 'outline'}
                        onClick={() => handleRecordEvent(playerId, btn.type, match.team_a_index)}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Team B */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Lag {match.team_b_index + 1}
              <Badge variant="outline" className="ml-auto">
                {localScoreB} mål
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(teamB?.players || []).map((playerId: string) => {
              const profile = getPlayerProfile(playerId);
              return (
                <div key={playerId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.image_url} />
                    <AvatarFallback className="bg-slate-200">
                      {profile?.alias?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 font-medium text-slate-900">
                    {profile?.alias || "Okänd"}
                  </div>
                  <div className="flex gap-2">
                    {eventButtons.map((btn) => (
                      <Button
                        key={btn.type}
                        size="sm"
                        variant={btn.type === 'goal' ? 'default' : 'outline'}
                        onClick={() => handleRecordEvent(playerId, btn.type, match.team_b_index)}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
