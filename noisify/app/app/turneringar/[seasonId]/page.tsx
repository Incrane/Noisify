import {
  getSeason,
  getLeaderboard,
  getMatchDays,
  isUserRegistered,
} from "@/app/actions/tournament";
import { SeasonDetailClient } from "@/components/tournament/season-detail-client";
import { redirect } from "next/navigation";

export const revalidate = 60; // Cache for 60 seconds

interface SeasonDetailPageProps {
  params: Promise<{ seasonId: string }>;
}

export default async function UserSeasonDetailPage({ params }: SeasonDetailPageProps) {
  const { seasonId } = await params;

  // Fetch all data in parallel on server
  const [season, leaderboard, matchDays, isRegistered] = await Promise.all([
    getSeason(seasonId),
    getLeaderboard(seasonId),
    getMatchDays(seasonId),
    isUserRegistered(seasonId),
  ]);

  if (!season) {
    redirect("/app/turneringar");
  }

  return (
    <SeasonDetailClient
      seasonId={seasonId}
      initialSeason={season}
      initialLeaderboard={leaderboard}
      initialMatchDays={matchDays}
      initialIsRegistered={isRegistered}
    />
  );
}
