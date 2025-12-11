"use client";

import { MapPin, Users, Play, CheckCircle2, XCircle, MoreVertical, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { MatchDayDetail } from "@/types/tournament";
import { MATCH_DAY_STATUS_LABELS } from "@/types/tournament";
import { deleteMatchDay, updateMatchDayStatus } from "@/app/actions/tournament";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MatchDayListProps {
  matchDays: MatchDayDetail[];
  seasonId: string;
  onUpdate: () => void;
}

export function MatchDayList({ matchDays, seasonId, onUpdate }: MatchDayListProps) {
  if (matchDays.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Inga matchdagar skapade än
      </div>
    );
  }

  const handleDelete = async (matchDayId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna matchdag?")) return;
    
    const result = await deleteMatchDay(matchDayId, seasonId);
    if (result.success) {
      toast.success("Matchdag borttagen");
      onUpdate();
    } else {
      toast.error(result.error || "Kunde inte ta bort matchdag");
    }
  };

  const handleStatusChange = async (matchDayId: string, status: MatchDayDetail["status"]) => {
    const result = await updateMatchDayStatus(matchDayId, status);
    if (result.success) {
      toast.success("Status uppdaterad");
      onUpdate();
    } else {
      toast.error(result.error || "Kunde inte uppdatera status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open_for_rsvp": return "default";
      case "rsvp_closed": return "secondary";
      case "in_progress": return "default";
      case "completed": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open_for_rsvp": return "bg-green-500";
      case "rsvp_closed": return "bg-amber-500";
      case "in_progress": return "bg-indigo-500";
      case "completed": return "bg-slate-400";
      case "cancelled": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="space-y-3">
      {matchDays.map((matchDay) => (
        <div
          key={matchDay.match_day_id}
          className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
        >
          {/* Date */}
          <div className="w-16 h-16 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0">
            <div className="text-xs font-medium text-slate-500 uppercase">
              {format(new Date(matchDay.date), "MMM", { locale: sv })}
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {format(new Date(matchDay.date), "d")}
            </div>
            <div className="text-xs text-slate-500">
              {format(new Date(matchDay.date), "HH:mm")}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("w-2 h-2 rounded-full", getStatusColor(matchDay.status))} />
              <Badge variant={getStatusBadgeVariant(matchDay.status) as "default" | "secondary" | "destructive" | "outline"}>
                {MATCH_DAY_STATUS_LABELS[matchDay.status]}
              </Badge>
            </div>
            <div className="font-medium text-slate-900">
              {format(new Date(matchDay.date), "EEEE d MMMM yyyy", { locale: sv })}
            </div>
            {matchDay.location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {matchDay.location}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="font-bold text-slate-900">{matchDay.attending_count}</div>
              <div className="text-xs text-slate-500">Närvaro</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="font-bold text-slate-900">{matchDay.checked_in_count}</div>
              <div className="text-xs text-slate-500">Incheckade</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {matchDay.status === "open_for_rsvp" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(matchDay.match_day_id, "rsvp_closed")}
              >
                Stäng närvaro
              </Button>
            )}
            {matchDay.status === "rsvp_closed" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(matchDay.match_day_id, "in_progress")}
                className="gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                Starta
              </Button>
            )}
            {matchDay.status === "in_progress" && (
              <Link href={`/staff/tournament/${seasonId}/matchdagar/${matchDay.match_day_id}`}>
                <Button size="sm" className="gap-1">
                  <Play className="w-3.5 h-3.5" />
                  Live
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/staff/tournament/${seasonId}/matchdagar/${matchDay.match_day_id}`} className="gap-2">
                    <Eye className="w-4 h-4" />
                    Visa detaljer
                  </Link>
                </DropdownMenuItem>
                {matchDay.status !== "completed" && matchDay.status !== "cancelled" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(matchDay.match_day_id, "cancelled")}
                    className="text-red-600 gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Ställ in
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(matchDay.match_day_id)}
                  className="text-red-600 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Ta bort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
