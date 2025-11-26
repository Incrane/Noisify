import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import FavoriteButton from "@/components/favorite-button";

interface Activity {
  activity_id: string;
  aktivitet: string;
  image_url: string | null;
  agande_organisation: string;
}

interface DashboardFavoritesProps {
  favorites: Activity[];
}

export default function DashboardFavorites({ favorites }: DashboardFavoritesProps) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <section className="space-y-4 mt-12">
      <h2 className="text-xl font-bold text-slate-900">Mina favoriter</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((activity) => (
          <div
            key={activity.activity_id}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all"
          >
            <Link href={`/app/aktiviteter/${activity.activity_id}`} className="block w-full h-full">
              {activity.image_url ? (
                <Image
                  src={activity.image_url}
                  alt={activity.aktivitet}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-slate-400" />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

              {/* Text Content */}
              <div className="absolute bottom-0 left-0 p-4 w-full pr-14">
                <h3 className="text-white font-bold text-lg truncate leading-tight">
                  {activity.aktivitet}
                </h3>
                <p className="text-slate-300 text-xs truncate mt-0.5">
                  {activity.agande_organisation}
                </p>
              </div>
            </Link>

            {/* Favorite Button - Higher z-index */}
            <div className="absolute bottom-3 right-3 z-10">
              <FavoriteButton 
                activityId={activity.activity_id} 
                isFavorite={true} 
                className="shadow-lg hover:scale-110 bg-white/10 text-white hover:bg-white hover:text-red-500 backdrop-blur-md border border-white/20" 
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
