"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LeaderboardEntry } from "@/types/tournament";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  compact?: boolean;
  currentUserId?: string;
}

export function LeaderboardTable({ entries, compact, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Inga spelare än
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-400">{rank}</span>;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors",
              currentUserId === entry.profile_id && "bg-indigo-50"
            )}
          >
            <div className="w-8 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.image_url || undefined} />
              <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                {entry.first_name?.charAt(0) || entry.alias?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {entry.is_staff_viewer && entry.first_name ? (
                <>
                  <div className="font-medium text-slate-900 truncate">
                    {entry.first_name} {entry.last_name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">@{entry.alias}</div>
                </>
              ) : (
                <div className="font-medium text-slate-900 truncate">{entry.alias}</div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-indigo-600">{entry.total_points}</div>
              <div className="text-xs text-slate-500">poäng</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Spelare</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Poäng</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mål</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assist</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">V</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">F</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matcher</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className={cn(
                "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                currentUserId === entry.profile_id && "bg-indigo-50 hover:bg-indigo-50"
              )}
            >
              <td className="py-3 px-2">
                <div className="flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.image_url || undefined} />
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                      {entry.first_name?.charAt(0) || entry.alias?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {entry.is_staff_viewer && entry.first_name ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {entry.first_name} {entry.last_name}
                      </span>
                      <span className="text-xs text-slate-500">@{entry.alias}</span>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-900">{entry.alias}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <span className="font-bold text-indigo-600">{entry.total_points}</span>
              </td>
              <td className="py-3 px-2 text-center text-slate-700">{entry.goals}</td>
              <td className="py-3 px-2 text-center text-slate-700">{entry.assists}</td>
              <td className="py-3 px-2 text-center text-green-600 font-medium">{entry.wins}</td>
              <td className="py-3 px-2 text-center text-red-600 font-medium">{entry.losses}</td>
              <td className="py-3 px-2 text-center text-slate-500">{entry.matches_played}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
