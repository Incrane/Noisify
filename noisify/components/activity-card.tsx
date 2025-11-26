import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import FavoriteButton from "@/components/favorite-button";

interface Activity {
  activity_id: string;
  slug?: string;
  aktivitet: string;
  agande_organisation: string;
  image_url: string | null;
  start_datum_tid: string;
  start_tid: string;
  slut_tid: string;
  plats: string | null;
  kapacitetsstatus: string;
  lediga_platser: number | null;
}

interface ActivityCardProps {
  activity: Activity;
  registrationStatus?: string | null;
  isFavorite?: boolean;
  href?: string; // Optional, defaults to constructed slug/id
  hideFavorite?: boolean;
}

export default function ActivityCard({ activity, registrationStatus, isFavorite = false, href, hideFavorite = false }: ActivityCardProps) {
  const linkHref = href || `/aktiviteter/${activity.slug || activity.activity_id}`;

  return (
    <div className="group block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all hover:border-indigo-200 relative">
      <Link href={linkHref} className="block">
        <div className="relative h-48 bg-slate-100">
          {activity.image_url ? (
            <Image
              src={activity.image_url}
              alt={activity.aktivitet}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300">
              <Calendar className="w-12 h-12" />
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {registrationStatus && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm
                  ${
                    registrationStatus === "ACCEPTED"
                      ? "bg-green-100 text-green-700"
                      : registrationStatus === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : registrationStatus === "WAITLISTED"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
              >
                {registrationStatus === "ACCEPTED"
                  ? "Anmäld"
                  : registrationStatus === "PENDING"
                  ? "Väntar svar"
                  : registrationStatus === "WAITLISTED"
                  ? "Reservplats"
                  : registrationStatus}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Favorite Button - Outside Link to prevent navigation when clicking heart */}
      {!hideFavorite && (
        <div className="absolute top-44 right-4 z-10">
          <FavoriteButton activityId={activity.activity_id} isFavorite={isFavorite} className="shadow-md" />
        </div>
      )}

      <Link href={linkHref} className="block">
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-1">
              {activity.aktivitet}
            </h3>
            <p className="text-sm text-slate-500">{activity.agande_organisation}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {new Date(activity.start_datum_tid).toLocaleDateString("sv-SE", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-slate-300">|</span>
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                {activity.start_tid} - {activity.slut_tid}
              </span>
            </div>

            {activity.plats && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">{activity.plats}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>
                {activity.kapacitetsstatus}
                {activity.lediga_platser !== null && activity.lediga_platser < 5 && (
                  <span className="text-red-500 ml-1">
                    ({activity.lediga_platser} kvar)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
