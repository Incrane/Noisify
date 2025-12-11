"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Clock, Users, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getMatchDay,
  getSeason,
  updateRSVP,
  isUserRegistered,
} from "@/app/actions/tournament";
import type { MatchDayDetail, SeasonDashboard } from "@/types/tournament";
import { MATCH_DAY_STATUS_LABELS } from "@/types/tournament";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMatchDayRealtime } from "@/hooks/use-tournament-realtime";

export default function UserMatchDayPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;
  const matchDayId = params.matchDayId as string;

  const [matchDay, setMatchDay] = useState<MatchDayDetail | null>(null);
  const [season, setSeason] = useState<SeasonDashboard | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentRsvp, setCurrentRsvp] = useState<"attending" | "not_attending" | null>(null);

  const loadData = useCallback(async () => {
    const [matchDayData, seasonData, registered] = await Promise.all([
      getMatchDay(matchDayId),
      getSeason(seasonId),
      isUserRegistered(seasonId),
    ]);
    setMatchDay(matchDayData);
    setSeason(seasonData);
    setIsRegistered(registered);
    
    // Check current user's RSVP status
    if (matchDayData?.rsvp_list) {
      // We need to get current user's profile_id
      // For now, we'll check if any RSVP matches in the action
    }
    
    setLoading(false);
  }, [matchDayId, seasonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates for RSVP count
  useMatchDayRealtime(matchDayId, loadData);

  const handleRsvp = async (status: "attending" | "not_attending") => {
    if (!isRegistered) {
      toast.error("Du måste vara anmäld till turneringen först");
      router.push(`/app/turneringar/${seasonId}`);
      return;
    }

    setUpdating(true);
    const result = await updateRSVP(matchDayId, status);
    setUpdating(false);

    if (result.success) {
      setCurrentRsvp(status);
      toast.success(status === "attending" ? "Du har anmält dig!" : "Du har avanmält dig");
      loadData();
    } else {
      toast.error(result.error || "Kunde inte uppdatera närvaro");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!matchDay || !season) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Matchdagen kunde inte hittas</p>
        <Button variant="link" onClick={() => router.push(`/app/turneringar/${seasonId}`)}>
          Tillbaka till turneringen
        </Button>
      </div>
    );
  }

  const isOpen = matchDay.status === "open_for_rsvp";
  const isCompleted = matchDay.status === "completed";
  const isCancelled = matchDay.status === "cancelled";


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/app/turneringar/${seasonId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {format(new Date(matchDay.date), "EEEE d MMMM", { locale: sv })}
              </h1>
              <Badge
                variant={
                  isOpen ? "default" :
                  isCompleted ? "outline" :
                  isCancelled ? "destructive" : "secondary"
                }
              >
                {MATCH_DAY_STATUS_LABELS[matchDay.status]}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">{season.name}</p>
          </div>
        </div>
      </div>

      {/* Match Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Datum</div>
                <div className="font-medium text-slate-900">
                  {format(new Date(matchDay.date), "d MMMM yyyy", { locale: sv })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Tid</div>
                <div className="font-medium text-slate-900">
                  {format(new Date(matchDay.date), "HH:mm", { locale: sv })}
                </div>
              </div>
            </div>
            {matchDay.location && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Plats</div>
                  <div className="font-medium text-slate-900">{matchDay.location}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* RSVP Section */}
      {isRegistered && isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anmäl närvaro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => handleRsvp("attending")}
                disabled={updating}
                variant={currentRsvp === "attending" ? "default" : "outline"}
                className={cn(
                  "flex-1 gap-2",
                  currentRsvp === "attending" && "bg-green-600 hover:bg-green-700"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Jag kommer
              </Button>
              <Button
                onClick={() => handleRsvp("not_attending")}
                disabled={updating}
                variant={currentRsvp === "not_attending" ? "default" : "outline"}
                className={cn(
                  "flex-1 gap-2",
                  currentRsvp === "not_attending" && "bg-red-600 hover:bg-red-700"
                )}
              >
                <XCircle className="w-4 h-4" />
                Kan inte komma
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isRegistered && isOpen && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-amber-900">Du är inte anmäld till turneringen</div>
              <div className="text-sm text-amber-700">Gå med i turneringen för att anmäla dig till matchdagar</div>
            </div>
            <Button onClick={() => router.push(`/app/turneringar/${seasonId}`)}>
              Gå med
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{matchDay.attending_count}</div>
            <div className="text-sm text-slate-500">Anmälda</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">
              {matchDay.generated_teams?.length || 0}
            </div>
            <div className="text-sm text-slate-500">Lag</div>
          </CardContent>
        </Card>
      </div>

      {/* Teams (if generated) */}
      {matchDay.generated_teams && matchDay.generated_teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {matchDay.generated_teams.map((team: { id?: string; name?: string; players?: string[] }, index: number) => (
                <div
                  key={team.id || index}
                  className="p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      index === 0 && "bg-red-500",
                      index === 1 && "bg-blue-500",
                      index === 2 && "bg-green-500",
                      index === 3 && "bg-yellow-500"
                    )} />
                    <span className="font-semibold text-slate-900">
                      {team.name || `Lag ${index + 1}`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {team.players?.map((playerId: string, pIndex: number) => (
                      <div key={playerId} className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-slate-200 text-xs">
                            {pIndex + 1}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-700">Spelare {pIndex + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {matchDay.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{matchDay.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
