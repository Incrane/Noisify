import Link from "next/link";
import { PartyPopper, ArrowRight } from "lucide-react";

interface InvitationBannerProps {
  count: number;
  href: string;
}

export default function InvitationBanner({ count, href }: InvitationBannerProps) {
  if (count === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <PartyPopper className="w-8 h-8 text-yellow-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            Du har {count} {count === 1 ? "ny inbjudan" : "nya inbjudningar"}!
          </h2>
          <p className="text-indigo-100">Kolla in dem och svara.</p>
        </div>
      </div>
      
      <Link 
        href={href}
        className="bg-white text-indigo-600 px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        Se inbjudningar
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
