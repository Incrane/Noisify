"use client";

import { Play, CheckCircle2, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/types/tournament";
import { cn } from "@/lib/utils";

interface MatchListProps {
  matches: Match[];
  currentMatchIndex: number | null;
  onStartMatch: (matchIndex: number) => void;
  onViewMatch: (matchIndex: number) => void;
}

const STATUS_LABELS: Record<Match["status"], string> = {
  pending: "Väntar",
  in_progress: "Pågår",
  completed: "Avslutad",
};

const STATUS_COLORS: Record<Match["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

export function MatchList({
  matches,
  currentMatchIndex,
  onStartMatch,
  onViewMatch,
}: MatchListProps) {
  const getTeamName = (index: number) => `Lag ${index + 1}`;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Inga matcher</h3>
          <p className="text-slate-500">
            Generera lag först för att skapa matcher.
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedMatches = matches.filter(m => m.status === "completed").length;
  const totalMatches = matches.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Matcher</span>
          <Badge variant="outline">
            {completedMatches}/{totalMatches} avslutade
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((match, index) => {
          const isActive = currentMatchIndex === index;
          const teamAName = getTeamName(match.team_a_index);
          const teamBName = getTeamName(match.team_b_index);
          
          return (
            <div
              key={match.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                isActive && "bg-amber-50 border-amber-200",
                match.status === "completed" && "bg-green-50 border-green-200",
                match.status === "pending" && "bg-slate-50 border-slate-200 hover:border-slate-300"
              )}
            >
              {/* Match Info */}
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-slate-500 w-8">
                  #{index + 1}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="font-medium">{teamAName}</span>
                  </div>
                  
                  {match.status === "completed" ? (
                    <div className="flex items-center gap-2 px-3">
                      <span className={cn(
                        "text-xl font-bold",
                        match.score_a > match.score_b ? "text-green-600" : "text-slate-600"
                      )}>
                        {match.score_a}
                      </span>
                      <span className="text-slate-400">-</span>
                      <span className={cn(
                        "text-xl font-bold",
                        match.score_b > match.score_a ? "text-green-600" : "text-slate-600"
                      )}>
                        {match.score_b}
                      </span>
                    </div>
                  ) : match.status === "in_progress" ? (
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-xl font-bold text-amber-600">
                        {match.score_a}
                      </span>
                      <span className="text-slate-400">-</span>
                      <span className="text-xl font-bold text-amber-600">
                        {match.score_b}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 px-3">vs</span>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">{teamBName}</span>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                {match.status === "in_progress" && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-medium">
                      {formatTime(match.time_remaining_seconds)}
                    </span>
                  </div>
                )}
                
                <Badge className={STATUS_COLORS[match.status]}>
                  {match.status === "completed" && match.winner_team_index !== null && (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  )}
                  {STATUS_LABELS[match.status]}
                </Badge>

                {match.status === "pending" && currentMatchIndex === null && (
                  <Button
                    size="sm"
                    onClick={() => onStartMatch(index)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Starta
                  </Button>
                )}

                {match.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewMatch(index)}
                  >
                    Visa match
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
