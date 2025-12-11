"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Search, Trash2, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getSeason,
  getSeasonPlayers,
  addPlayerToSeason,
  removePlayerFromSeason,

  getOrganizationMembersForTournament,
} from "@/app/actions/tournament";
import type { SeasonDashboard, PlayerStats } from "@/types/tournament";
import { toast } from "sonner";

interface MemberResult {
  id: string;
  alias: string;
  image_url: string | null;
  first_name?: string;
  last_name?: string;
}

export default function PlayerStatsPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [season, setSeason] = useState<SeasonDashboard | null>(null);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [orgMembers, setOrgMembers] = useState<MemberResult[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<{ profileId: string; alias: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    const [seasonData, playersData] = await Promise.all([
      getSeason(seasonId),
      getSeasonPlayers(seasonId),
    ]);
    setSeason(seasonData);
    setPlayers(playersData);
    setLoading(false);
  }, [seasonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load org members when dialog opens
  const loadOrgMembers = async () => {
    if (!season?.organization_id) return;
    setLoadingMembers(true);
    const members = await getOrganizationMembersForTournament(season.organization_id);
    setOrgMembers(members);
    setLoadingMembers(false);
  };

  const handleDialogOpen = (open: boolean) => {
    setShowAddDialog(open);
    if (open) {
      loadOrgMembers();
    } else {
      setSearchQuery("");
    }
  };



  const handleAddPlayer = async (profileId: string) => {
    const result = await addPlayerToSeason(seasonId, profileId);
    if (result.success) {
      toast.success("Spelare tillagd!");
      setShowAddDialog(false);
      setSearchQuery("");
      loadData();
    } else {
      toast.error(result.error || "Kunde inte lägga till spelare");
    }
  };

  const openDeleteConfirm = (profileId: string, alias: string) => {
    setPlayerToDelete({ profileId, alias });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!playerToDelete) return;

    setIsDeleting(true);
    const result = await removePlayerFromSeason(seasonId, playerToDelete.profileId);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Spelare borttagen");
      setDeleteConfirmOpen(false);
      setPlayerToDelete(null);
      loadData();
    } else {
      toast.error(result.error || "Kunde inte ta bort spelare");
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setPlayerToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-slate-900">Spelarstatistik</h1>
            <p className="text-slate-500">{season?.name}</p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Lägg till spelare
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lägg till spelare</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Sök efter namn eller alias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingMembers ? (
                <p className="text-sm text-slate-500 text-center py-4">Laddar medlemmar...</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orgMembers
                    .filter(member => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      const fullName = `${member.first_name || ""} ${member.last_name || ""}`.toLowerCase();
                      const alias = (member.alias || "").toLowerCase();
                      return fullName.includes(q) || alias.includes(q);
                    })
                    .length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      {searchQuery ? "Inga användare hittades" : "Inga tillgängliga medlemmar"}
                    </p>
                  ) : (
                    orgMembers
                      .filter(member => {
                        // Also filter out already added players
                        const isAlreadyAdded = players.some(p => p.profile_id === member.id);
                        if (isAlreadyAdded) return false;

                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        const fullName = `${member.first_name || ""} ${member.last_name || ""}`.toLowerCase();
                        const alias = (member.alias || "").toLowerCase();
                        return fullName.includes(q) || alias.includes(q);
                      })
                      .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.image_url || undefined} />
                              <AvatarFallback className="bg-slate-200">
                                {(member.first_name?.[0] || member.alias?.[0])?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-slate-900">
                                {member.first_name ? `${member.first_name} ${member.last_name || ""}`.trim() : member.alias}
                              </div>
                              <div className="text-sm text-slate-500">@{member.alias}</div>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleAddPlayer(member.id)}>
                            Lägg till
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">{players.length}</div>
            <div className="text-sm text-slate-500">Totalt spelare</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {players.reduce((sum, p) => sum + p.goals, 0)}
            </div>
            <div className="text-sm text-slate-500">Totalt mål</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {players.reduce((sum, p) => sum + p.assists, 0)}
            </div>
            <div className="text-sm text-slate-500">Totalt assist</div>
          </CardContent>
        </Card>
      </div>

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle>Spelare ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Inga spelare</h3>
              <p className="text-slate-500 mb-4">
                Lägg till spelare för att komma igång med turneringen.
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Lägg till spelare
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Spelare</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <Trophy className="w-4 h-4 mx-auto" />
                    </th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <Target className="w-4 h-4 mx-auto" />
                    </th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assist</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">V</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">F</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matcher</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {players
                    .sort((a, b) => b.total_points - a.total_points)
                    .map((player, index) => {
                      const profile = (player as PlayerStats & { profiles?: { alias: string; image_url: string | null } }).profiles;
                      return (
                        <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-2 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.image_url || undefined} />
                                <AvatarFallback className="bg-slate-200 text-xs">
                                  {profile?.alias?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-900">{profile?.alias || "Okänd"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-indigo-600">{player.total_points}</td>
                          <td className="py-3 px-2 text-center text-slate-700">{player.goals}</td>
                          <td className="py-3 px-2 text-center text-slate-700">{player.assists}</td>
                          <td className="py-3 px-2 text-center text-green-600 font-medium">{player.wins}</td>
                          <td className="py-3 px-2 text-center text-red-600 font-medium">{player.losses}</td>
                          <td className="py-3 px-2 text-center text-slate-500">{player.matches_played}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant={player.status === "active" ? "default" : "secondary"}>
                              {player.status === "active" ? "Aktiv" : player.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              onClick={() => openDeleteConfirm(player.profile_id, profile?.alias || "Okänd")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ta bort spelare</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort <span className="font-medium">{playerToDelete?.alias}</span> från turneringen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Tar bort..." : "Ta bort"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
