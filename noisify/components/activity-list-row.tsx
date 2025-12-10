import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Building2, ArrowRight, CheckCircle2, Hourglass } from "lucide-react";

interface Activity {
  activity_id: string;
  aktivitet: string;
  agande_organisation: string;
  image_url: string | null;
  start_datum_tid: string;
  start_tid: string;
  slut_tid: string;
  plats: string | null;
  hide_address: boolean | null;
}

interface ActivityListRowProps {
  activity: Activity;
  registrationStatus?: string | null;
  href: string;
}

export default function ActivityListRow({ activity, registrationStatus, href }: ActivityListRowProps) {
  const getStatusBadge = () => {
    switch (registrationStatus) {
      case "ACCEPTED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full w-fit shadow-sm border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bekräftad</span>
          </div>
        );
      case "PENDING":
      case "WAITLISTED":
      case "INVITED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full w-fit shadow-sm border border-orange-200">
            <Hourglass className="w-3.5 h-3.5" />
            <span>Väntar på svar</span>
          </div>
        );
      default:
        return null;
    }
  };

  const startDate = new Date(activity.start_datum_tid);
  const dateStr = startDate.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  // Capitalize first letter of date
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const showAddress = !activity.hide_address || registrationStatus === 'ACCEPTED';

  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl p-3 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Image */}
        <div className="relative w-full sm:w-32 h-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
          {activity.image_url ? (
            <Image
              src={activity.image_url}
              alt={activity.aktivitet}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300">
              <Calendar className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">

          {/* Header: Title & Status */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
              {activity.aktivitet}
            </h3>
            {getStatusBadge()}
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="capitalize font-medium text-slate-700">{formattedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                {activity.start_tid} - {activity.slut_tid}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-500">{activity.agande_organisation}</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-500">
                {showAddress ? (activity.plats || 'Ingen plats angiven') : 'Platsinformation dold'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Arrow */}
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0 ml-2">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
