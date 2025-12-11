"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Calendar, Trophy, Settings, Play, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getSeason, getLeaderboard, getMatchDays, updateSeason } from "@/app/actions/tournament";
import type { SeasonDashboard, LeaderboardEntry, MatchDayDetail } from "@/types/tournament";
import { LeaderboardTable } from "@/components/tournament/leaderboard-table";
import { MatchDayList } from "@/components/tournament/match-day-list";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";

export default function SeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [season, setSeason] = useState<SeasonDashboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [matchDays, setMatchDays] = useState<MatchDayDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      const [seasonData, leaderboardData, matchDaysData] = await Promise.all([
        getSeason(seasonId),
        getLeaderboard(seasonId),
        getMatchDays(seasonId),
      ]);
      setSeason(seasonData);
      setLeaderboard(leaderboardData);
      setMatchDays(matchDaysData);
      setLoading(false);
    }
    loadData();
  }, [seasonId]);

  const toggleActive = async () => {
    if (!season) return;
    const result = await updateSeason(seasonId, { is_active: !season.is_active });
    if (result.success) {
      setSeason({ ...season, is_active: !season.is_active });
      toast.success(season.is_active ? "Säsong inaktiverad" : "Säsong aktiverad");
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
        <p className="text-slate-500">Säsongen kunde inte hittas</p>
        <Button variant="link" onClick={() => router.push("/staff/tournament")}>
          Tillbaka till turneringar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/staff/tournament")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{season.name}</h1>
              <Badge variant={season.is_active ? "default" : "secondary"}>
                {season.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            {season.description && (
              <p className="text-slate-500 mt-1">{season.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleActive}>
            {season.is_active ? "Inaktivera" : "Aktivera"}
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{season.player_count}</div>
              <div className="text-sm text-slate-500">Spelare</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{season.total_match_days}</div>
              <div className="text-sm text-slate-500">Matchdagar</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{season.completed_match_days}</div>
              <div className="text-sm text-slate-500">Avslutade</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              {season.next_match_day ? (
                <>
                  <div className="text-sm font-bold text-slate-900">
                    {format(new Date(season.next_match_day), "d MMM", { locale: sv })}
                  </div>
                  <div className="text-sm text-slate-500">Nästa match</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-slate-500">-</div>
                  <div className="text-sm text-slate-500">Nästa match</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="leaderboard">Tabell</TabsTrigger>
          <TabsTrigger value="matchdays">Matchdagar</TabsTrigger>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/staff/tournament/${seasonId}/matchdagar/new`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" />
                    Skapa ny matchdag
                  </Button>
                </Link>
                <Link href={`/staff/tournament/${seasonId}/spelarstatistik`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <UserPlus className="w-4 h-4" />
                    Hantera spelare
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Point Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Poängsystem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(season.point_config).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700 capitalize">{key}</span>
                      <span className="text-indigo-600 font-bold">{value} poäng</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Leaderboard */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Topplista</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("leaderboard")}>
                Visa alla
              </Button>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={leaderboard.slice(0, 5)} compact />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tabell</CardTitle>
              <Link href={`/staff/tournament/${seasonId}/spelarstatistik`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Hantera spelare
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Inga spelare har registrerat sig än
                </div>
              ) : (
                <LeaderboardTable entries={leaderboard} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matchdays" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Matchdagar</CardTitle>
              <Link href={`/staff/tournament/${seasonId}/matchdagar/new`}>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ny matchdag
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <MatchDayList 
                matchDays={matchDays} 
                seasonId={seasonId}
                onUpdate={async () => {
                  const data = await getMatchDays(seasonId);
                  setMatchDays(data);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registreringsregler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Hantering</div>
                  <div className="font-medium">
                    {season.registration_config.method === "automatic" ? "Automatisk" : "Manuell"}
                  </div>
                </div>
                {season.registration_config.access && (
                  <div>
                    <div className="text-sm text-slate-500">Behörighet</div>
                    <div className="font-medium">
                      {season.registration_config.access === "open_for_all" && "Öppen för alla"}
                      {season.registration_config.access === "members_only" && "Endast medlemmar"}
                      {season.registration_config.access === "selected_members" && "Utvalda medlemmar"}
                    </div>
                  </div>
                )}
                {season.registration_config.min_age && (
                  <div>
                    <div className="text-sm text-slate-500">Minimiålder</div>
                    <div className="font-medium">{season.registration_config.min_age} år</div>
                  </div>
                )}
                {season.registration_config.max_age && (
                  <div>
                    <div className="text-sm text-slate-500">Maxålder</div>
                    <div className="font-medium">{season.registration_config.max_age} år</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
