import { Trophy, Users, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getPublicSeasons } from "@/app/actions/tournament";
import type { SeasonDashboard } from "@/types/tournament";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import TournamentFilter from "@/components/tournament-filter";

export const revalidate = 60; // Cache for 60 seconds

interface TournamentPageProps {
  searchParams: Promise<{ org?: string }>;
}

export default async function TournamentBrowsePage({ searchParams }: TournamentPageProps) {
  const params = await searchParams;
  const orgFilter = params.org;

  // Fetch data on server
  const seasons = await getPublicSeasons(orgFilter);

  // Get unique organizations for filter
  const organizations = Array.from(
    new Set(seasons.map(s => JSON.stringify({ id: s.organization_id, name: s.organization_name })))
  ).map(s => JSON.parse(s));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turneringar</h1>
          <p className="text-slate-500 mt-1">Utforska och gå med i turneringar</p>
        </div>
      </div>

      {/* Filter */}
      {organizations.length > 1 && (
        <TournamentFilter organizations={organizations} currentFilter={orgFilter} />
      )}

      {/* Seasons Grid */}
      {seasons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Inga aktiva turneringar</h3>
            <p className="text-slate-500 text-center max-w-md">
              Det finns inga turneringar öppna för anmälan just nu. Kom tillbaka senare!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => (
            <SeasonCard key={season.season_id} season={season} />
          ))}
        </div>
      )}
    </div>
  );
}

function SeasonCard({ season }: { season: SeasonDashboard }) {
  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 truncate">{season.name}</h3>
                <Badge variant="default" className="shrink-0 bg-green-600">
                  Öppen
                </Badge>
              </div>
              {season.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{season.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-indigo-600">{season.organization_name}</span>
          </div>
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
          href={`/app/turneringar/${season.season_id}`}
          className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <span>Visa turnering</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
