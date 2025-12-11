"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  getSeason,
  getLeaderboard,
  getMatchDays,
  isUserRegistered,
  joinSeason,
  checkEligibility,
} from "@/app/actions/tournament";
import type { SeasonDashboard, LeaderboardEntry, MatchDayDetail } from "@/types/tournament";
import { LeaderboardTable } from "@/components/tournament/leaderboard-table";
import { MATCH_DAY_STATUS_LABELS } from "@/types/tournament";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSeasonDashboardRealtime } from "@/hooks/use-tournament-realtime";

export default function UserSeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [season, setSeason] = useState<SeasonDashboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [matchDays, setMatchDays] = useState<MatchDayDetail[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = useCallback(async () => {
    const [seasonData, leaderboardData, matchDaysData, registered] = await Promise.all([
      getSeason(seasonId),
      getLeaderboard(seasonId),
      getMatchDays(seasonId),
      isUserRegistered(seasonId),
    ]);
    setSeason(seasonData);
    setLeaderboard(leaderboardData);
    setMatchDays(matchDaysData);
    setIsRegistered(registered);
    setLoading(false);
  }, [seasonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time leaderboard and match day updates
  useSeasonDashboardRealtime(seasonId, loadData);

  const handleJoin = async () => {
    // First check eligibility
    const eligibility = await checkEligibility(seasonId);
    if (!eligibility.eligible) {
      toast.error(eligibility.reason || "Du uppfyller inte kraven för denna turnering");
      return;
    }

    setJoining(true);
    const result = await joinSeason(seasonId);
    setJoining(false);

    if (result.success) {
      toast.success("Du är nu anmäld till turneringen!");
      setIsRegistered(true);
      loadData();
    } else {
      toast.error(result.error || "Kunde inte gå med i turneringen");
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

  if (!season) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Turneringen kunde inte hittas</p>
        <Button variant="link" onClick={() => router.push("/app/turneringar")}>
          Tillbaka till turneringar
        </Button>
      </div>
    );
  }

  const upcomingMatchDays = matchDays.filter(
    m => m.status === "open_for_rsvp" || m.status === "rsvp_closed"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app/turneringar")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{season.name}</h1>
              {isRegistered && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Anmäld
                </Badge>
              )}
            </div>
            <p className="text-slate-500 mt-1">
              {season.organization_name}
            </p>
          </div>
        </div>

        {!isRegistered && season.is_active && (
          <Button onClick={handleJoin} disabled={joining} className="gap-2">
            <Trophy className="w-4 h-4" />
            {joining ? "Anmäler..." : "Gå med"}
          </Button>
        )}
      </div>

      {/* Description */}
      {season.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-slate-600">{season.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{season.player_count}</div>
            <div className="text-sm text-slate-500">Spelare</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{season.total_match_days}</div>
            <div className="text-sm text-slate-500">Matchdagar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{season.completed_match_days}</div>
            <div className="text-sm text-slate-500">Spelade</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-slate-900">
              {season.next_match_day 
                ? format(new Date(season.next_match_day), "d MMM", { locale: sv })
                : "-"
              }
            </div>
            <div className="text-sm text-slate-500">Nästa match</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="leaderboard">Tabell</TabsTrigger>
          <TabsTrigger value="matchdays">Matchdagar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Upcoming Match Days */}
          {upcomingMatchDays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kommande matchdagar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMatchDays.slice(0, 3).map((matchDay) => (
                  <Link
                    key={matchDay.match_day_id}
                    href={`/app/turneringar/${seasonId}/matchdag/${matchDay.match_day_id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm">
                        <div className="text-xs text-slate-500">
                          {format(new Date(matchDay.date), "MMM", { locale: sv })}
                        </div>
                        <div className="text-lg font-bold text-slate-900">
                          {format(new Date(matchDay.date), "d")}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {format(new Date(matchDay.date), "EEEE", { locale: sv })}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(matchDay.date), "HH:mm")}
                          {matchDay.location && (
                            <>
                              <span>•</span>
                              <MapPin className="w-3.5 h-3.5" />
                              {matchDay.location}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={matchDay.status === "open_for_rsvp" ? "default" : "secondary"}>
                      {MATCH_DAY_STATUS_LABELS[matchDay.status]}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Point System */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Poängsystem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(season.point_config).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{value}</div>
                    <div className="text-sm text-slate-500 capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Topplista</CardTitle>
              {isRegistered && leaderboard.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("leaderboard")}>
                  Visa alla
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!isRegistered ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Gå med i turneringen för att se tabellen</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-slate-500 text-center py-6">Inga spelare än</p>
              ) : (
                <LeaderboardTable entries={leaderboard.slice(0, 5)} compact />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabell</CardTitle>
            </CardHeader>
            <CardContent>
              {!isRegistered ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-2">Tabellen är dold</h3>
                  <p className="text-slate-500 mb-4">Gå med i turneringen för att se tabellen</p>
                  <Button onClick={handleJoin} disabled={joining}>
                    {joining ? "Anmäler..." : "Gå med"}
                  </Button>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Inga spelare har registrerat sig än
                </p>
              ) : (
                <LeaderboardTable entries={leaderboard} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matchdays" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alla matchdagar</CardTitle>
            </CardHeader>
            <CardContent>
              {matchDays.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Inga matchdagar schemalagda
                </p>
              ) : (
                <div className="space-y-3">
                  {matchDays.map((matchDay) => (
                    <Link
                      key={matchDay.match_day_id}
                      href={`/app/turneringar/${seasonId}/matchdag/${matchDay.match_day_id}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        matchDay.status === "completed" 
                          ? "bg-slate-100" 
                          : "bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm">
                          <div className="text-xs text-slate-500">
                            {format(new Date(matchDay.date), "MMM", { locale: sv })}
                          </div>
                          <div className="text-lg font-bold text-slate-900">
                            {format(new Date(matchDay.date), "d")}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {format(new Date(matchDay.date), "EEEE d MMMM", { locale: sv })}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(matchDay.date), "HH:mm")}
                            {matchDay.location && (
                              <>
                                <span>•</span>
                                <MapPin className="w-3.5 h-3.5" />
                                {matchDay.location}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <div className="font-medium text-slate-700">
                            {matchDay.attending_count} närvaro
                          </div>
                        </div>
                        <Badge 
                          variant={
                            matchDay.status === "completed" ? "outline" :
                            matchDay.status === "cancelled" ? "destructive" :
                            matchDay.status === "open_for_rsvp" ? "default" : "secondary"
                          }
                        >
                          {MATCH_DAY_STATUS_LABELS[matchDay.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
