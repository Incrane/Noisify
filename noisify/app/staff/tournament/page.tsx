"use client";

import { useEffect, useState } from "react";
import { Plus, Trophy, Users, Calendar, ChevronRight, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getSeasons, deleteSeason } from "@/app/actions/tournament";
import { getSelectedOrganization } from "@/app/staff/actions";
import type { SeasonDashboard } from "@/types/tournament";
import { CreateSeasonModal } from "@/components/tournament/create-season-modal";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";

export default function TournamentPage() {
  const [seasons, setSeasons] = useState<SeasonDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const selectedOrgId = await getSelectedOrganization();
        if (selectedOrgId) {
          setOrgId(selectedOrgId);
          const data = await getSeasons(selectedOrgId);
          setSeasons(data);
        }
      } catch (error) {
        console.error("Failed to load tournament data:", error);
        toast.error("Kunde inte hämta turneringar.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDelete = async (seasonId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna säsong?")) return;

    const result = await deleteSeason(seasonId);
    if (result.success) {
      setSeasons(seasons.filter(s => s.season_id !== seasonId));
      toast.success("Säsong borttagen");
    } else {
      toast.error(result.error || "Kunde inte ta bort säsong");
    }
  };

  const handleSeasonCreated = async () => {
    setShowCreateModal(false);
    if (orgId) {
      const data = await getSeasons(orgId);
      setSeasons(data);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turneringar</h1>
          <p className="text-slate-500 mt-1">Hantera säsonger, ligor och turneringar</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ny säsong
        </Button>
      </div>

      {/* Seasons Grid */}
      {seasons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Inga säsonger än</h3>
            <p className="text-slate-500 text-center mb-6 max-w-md">
              Skapa din första säsong för att börja hantera turneringar med poängsystem och lagindelning.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Skapa första säsongen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((season) => (
            <SeasonCard
              key={season.season_id}
              season={season}
              onDelete={() => handleDelete(season.season_id)}
            />
          ))}
        </div>
      )}

      {/* Create Season Modal */}
      {showCreateModal && orgId && (
        <CreateSeasonModal
          orgId={orgId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSeasonCreated}
        />
      )}
    </div>
  );
}

function SeasonCard({
  season,
  onDelete
}: {
  season: SeasonDashboard;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 pb-3 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate">{season.name}</h3>
              <Badge variant={season.is_active ? "default" : "secondary"} className="shrink-0">
                {season.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            {season.description && (
              <p className="text-sm text-slate-500 line-clamp-2">{season.description}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/staff/tournament/${season.season_id}`} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Visa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/staff/tournament/${season.season_id}?edit=true`} className="gap-2">
                  <Pencil className="w-4 h-4" />
                  Redigera
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600 gap-2">
                <Trash2 className="w-4 h-4" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="px-4 pb-3 grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold text-slate-900">{season.player_count}</div>
            <div className="text-xs text-slate-500">Spelare</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold text-slate-900">{season.total_match_days}</div>
            <div className="text-xs text-slate-500">Matchdagar</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold text-slate-900">{season.completed_match_days}</div>
            <div className="text-xs text-slate-500">Avslutade</div>
          </div>
        </div>

        {/* Next Match */}
        {season.next_match_day && (
          <div className="px-4 pb-3">
            <div className="text-xs text-slate-500 mb-1">Nästa matchdag</div>
            <div className="text-sm font-medium text-slate-900">
              {format(new Date(season.next_match_day), "EEEE d MMMM, HH:mm", { locale: sv })}
            </div>
          </div>
        )}

        {/* Footer */}
        <Link
          href={`/staff/tournament/${season.season_id}`}
          className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <span>Hantera säsong</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
