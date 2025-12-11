"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Trophy,
  Play,
  CheckCircle2,
  Undo2,
  UserCheck,
  Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMatchDay,
  getSeasonPlayers,
  getMatchEvents,
  updateMatchDayStatus,
  checkInPlayer,
  generateTeams,
  undoEvent,
  staffAddPlayerToMatchDay,
  startMatch,
  getSeason,
  updateTeams,
  generateMatches,
} from "@/app/actions/tournament";
import type { MatchDayDetail, PlayerStats, MatchEvent, SeasonDashboard, Match } from "@/types/tournament";
import { MATCH_DAY_STATUS_LABELS } from "@/types/tournament";
import { MatchList } from "@/components/tournament/match-list";
import { ActiveMatchView } from "@/components/tournament/active-match-view";
import { TeamEditor } from "@/components/tournament/team-editor";
import type { GeneratedTeam } from "@/types/tournament";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMatchDayRealtime } from "@/hooks/use-tournament-realtime";

export default function MatchDayLivePage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;
  const matchDayId = params.matchDayId as string;

  const [matchDay, setMatchDay] = useState<MatchDayDetail | null>(null);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [season, setSeason] = useState<SeasonDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("checkin");
  const [showActiveMatch, setShowActiveMatch] = useState(false);

  const loadData = useCallback(async () => {
    const [matchDayData, playersData, eventsData, seasonData] = await Promise.all([
      getMatchDay(matchDayId),
      getSeasonPlayers(seasonId),
      getMatchEvents(matchDayId),
      getSeason(seasonId),
    ]);
    setMatchDay(matchDayData);
    setPlayers(playersData);
    setEvents(eventsData);
    setSeason(seasonData);
    setLoading(false);
  }, [matchDayId, seasonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates for live scoring
  useMatchDayRealtime(matchDayId, loadData);

  const handleStatusChange = async (status: MatchDayDetail["status"]) => {
    const result = await updateMatchDayStatus(matchDayId, status);
    if (result.success) {
      toast.success("Status uppdaterad");
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const handleCheckIn = async (profileId: string) => {
    const result = await checkInPlayer(matchDayId, profileId);
    if (result.success) {
      toast.success("Spelare incheckad");
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const handleAddToRsvp = async (profileId: string) => {
    const result = await staffAddPlayerToMatchDay(matchDayId, profileId);
    if (result.success) {
      toast.success("Spelare tillagd");
      loadData();
    } else {
      toast.error(result.error || "Kunde inte lägga till spelare");
    }
  };

  const handleGenerateTeams = async () => {
    const result = await generateTeams(matchDayId, 4);
    if (result.success) {
      toast.success("Lag och matcher genererade!");
      loadData();
      setActiveTab("teams"); // Changed from "matches" to "teams" so user can see/edit teams first
    } else {
      toast.error(result.error);
    }
  };

  const handleStartMatch = async (matchIndex: number) => {
    const result = await startMatch(matchDayId, matchIndex);
    if (result.success) {
      toast.success("Match startad!");
      setShowActiveMatch(true);
      setActiveTab("matches");
      loadData();
    } else {
      toast.error(result.error || "Kunde inte starta match");
    }
  };

  const handleMatchEnd = (result: { winner_team_index: number | null; score_a: number; score_b: number }) => {
    const winnerText = result.winner_team_index !== null
      ? `Lag ${result.winner_team_index + 1} vann ${result.score_a}-${result.score_b}!`
      : `Oavgjort ${result.score_a}-${result.score_b}`;
    toast.success(winnerText);
    setShowActiveMatch(false);
    loadData();
  };

  const handleUndoEvent = async (eventId: string) => {
    const result = await undoEvent(eventId);
    if (result.success) {
      toast.success("Händelse ångrad");
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const handleTeamsChange = async (newTeams: GeneratedTeam[]) => {
    const result = await updateTeams(matchDayId, newTeams);
    if (result.success) {
      loadData();
    } else {
      toast.error(result.error || "Kunde inte uppdatera lag");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!matchDay) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Matchdagen kunde inte hittas</p>
        <Button variant="link" onClick={() => router.push(`/staff/tournament/${seasonId}`)}>
          Tillbaka till säsongen
        </Button>
      </div>
    );
  }

  const rsvpList = matchDay.rsvp_list || {};
  const attendingPlayers = players.filter(p => rsvpList[p.profile_id]?.status === "attending");
  const checkedInPlayers = players.filter(p => rsvpList[p.profile_id]?.checked_in);
  const teams = matchDay.generated_teams || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/staff/tournament/${seasonId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {format(new Date(matchDay.date), "EEEE d MMMM", { locale: sv })}
              </h1>
              <Badge>{MATCH_DAY_STATUS_LABELS[matchDay.status]}</Badge>
            </div>
            {matchDay.location && (
              <p className="text-slate-500 mt-1">{matchDay.location}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {matchDay.status === "open_for_rsvp" && (
            <Button onClick={() => handleStatusChange("rsvp_closed")}>
              Stäng närvaro
            </Button>
          )}
          {matchDay.status === "rsvp_closed" && (
            <Button onClick={() => handleStatusChange("in_progress")} className="gap-2">
              <Play className="w-4 h-4" />
              Starta match
            </Button>
          )}
          {matchDay.status === "in_progress" && (
            <Button onClick={() => handleStatusChange("completed")} variant="outline" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Avsluta
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{attendingPlayers.length}</div>
              <div className="text-sm text-slate-500">Anmälda</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{checkedInPlayers.length}</div>
              <div className="text-sm text-slate-500">Incheckade</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{teams.length}</div>
              <div className="text-sm text-slate-500">Lag</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checkin">Incheckning</TabsTrigger>
          <TabsTrigger value="teams">Lag</TabsTrigger>
          <TabsTrigger value="matches" disabled={teams.length < 2}>
            Matcher
          </TabsTrigger>
          <TabsTrigger value="events">Händelser</TabsTrigger>
        </TabsList>

        {/* Check-in Tab */}
        <TabsContent value="checkin" className="mt-6 space-y-6">
          {/* Attending players */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anmälda spelare ({attendingPlayers.length})</CardTitle>
              {checkedInPlayers.length >= 4 && matchDay.status !== "in_progress" && (
                <Button onClick={handleGenerateTeams} className="gap-2">
                  <Shuffle className="w-4 h-4" />
                  Generera lag
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {attendingPlayers.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Inga spelare har anmält sig än. Lägg till spelare från listan nedan.
                </p>
              ) : (
                <div className="space-y-2">
                  {attendingPlayers.map((player) => {
                    const isCheckedIn = rsvpList[player.profile_id]?.checked_in;
                    const profile = (player as { profiles?: { alias?: string; image_url?: string } }).profiles;
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-colors",
                          isCheckedIn ? "bg-green-50" : "bg-slate-50 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.image_url} />
                            <AvatarFallback className="bg-slate-200">
                              {profile?.alias?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {profile?.alias || "Okänd"}
                            </div>
                            <div className="text-sm text-slate-500">
                              {player.total_points} poäng
                            </div>
                          </div>
                        </div>
                        {isCheckedIn ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Incheckad
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(player.profile_id)}
                          >
                            Checka in
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All registered players - staff can add them to RSVP */}
          <Card>
            <CardHeader>
              <CardTitle>Alla turneringsspelare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Lägg till spelare till matchdagen direkt. De behöver inte anmäla sig själva.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players
                  .filter(p => !rsvpList[p.profile_id]?.status)
                  .map((player) => {
                    const profile = (player as { profiles?: { alias?: string; image_url?: string } }).profiles;
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.image_url} />
                            <AvatarFallback className="bg-slate-200">
                              {profile?.alias?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {profile?.alias || "Okänd"}
                            </div>
                            <div className="text-sm text-slate-500">
                              {player.total_points} poäng
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToRsvp(player.profile_id)}
                        >
                          Lägg till
                        </Button>
                      </div>
                    );
                  })}
                {players.filter(p => !rsvpList[p.profile_id]?.status).length === 0 && (
                  <p className="text-slate-500 text-center py-4">
                    Alla spelare är redan tillagda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6">
          {teams.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shuffle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">Inga lag genererade</h3>
                <p className="text-slate-500 mb-4">
                  Checka in spelare och klicka på &quot;Generera lag&quot; för att skapa lag med snake draft.
                </p>
                {checkedInPlayers.length >= 4 && (
                  <Button onClick={handleGenerateTeams} className="gap-2">
                    <Shuffle className="w-4 h-4" />
                    Generera lag
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Klicka på lagfärgen för att ändra, eller dra spelare mellan lag
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTeams}
                  className="gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Regenerera lag
                </Button>
              </div>
              <TeamEditor
                teams={teams}
                players={players}
                checkedInPlayerIds={checkedInPlayers.map(p => p.profile_id)}
                onTeamsChange={handleTeamsChange}
                disabled={matchDay.status === "in_progress" || matchDay.status === "completed"}
              />
            </div>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6">
          {matchDay.current_match_index !== null && showActiveMatch && season ? (
            <ActiveMatchView
              matchDayId={matchDayId}
              match={(matchDay.matches || [])[matchDay.current_match_index] as Match}
              teams={teams}
              players={players}
              pointConfig={season.point_config}
              onMatchEnd={handleMatchEnd}
              onDataRefresh={loadData}
            />
          ) : (matchDay.matches || []).length > 0 ? (
            <MatchList
              matches={(matchDay.matches || []) as Match[]}
              currentMatchIndex={matchDay.current_match_index}
              onStartMatch={handleStartMatch}
              onViewMatch={() => {
                setShowActiveMatch(true);
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">Inga matcher</h3>
                <p className="text-slate-500 mb-4">
                  {teams.length >= 2
                    ? "Klicka på knappen nedan för att generera matcher för lagen."
                    : "Generera lag först för att skapa matcher."}
                </p>
                {teams.length >= 2 && (
                  <Button onClick={async () => {
                    const result = await generateMatches(matchDayId);
                    if (result.success) {
                      toast.success("Matcher genererade!");
                      loadData();
                    } else {
                      toast.error(result.error);
                    }
                  }} className="gap-2">
                    <Play className="w-4 h-4" />
                    Generera matcher
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Händelselogg</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Inga händelser registrerade
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => {
                    const profile = (event as any).profiles;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.image_url} />
                            <AvatarFallback className="bg-slate-200 text-xs">
                              {profile?.alias?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {profile?.alias || "Okänd"} - <span className="capitalize">{event.event_type}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {format(new Date(event.created_at), "HH:mm:ss")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">+{event.points_awarded} p</Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => handleUndoEvent(event.id)}
                          >
                            <Undo2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
