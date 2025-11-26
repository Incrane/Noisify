import { ArrowLeft, Bell, User, Shield, Palette, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/app/profil">
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </div>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Inställningar</h1>
            </div>

            <div className="space-y-4">
                <SettingsLink
                    href="/app/profil/installningar/notiser"
                    icon={Bell}
                    title="Notiser"
                    description="Hantera e-post, SMS och push-notiser"
                />
                <SettingsLink
                    href="/app/profil/installningar/konto"
                    icon={User}
                    title="Konto"
                    description="Redigera profil, lösenord och kontaktinfo"
                />
                <SettingsLink
                    href="/app/profil/installningar/integritet"
                    icon={Shield}
                    title="Integritet"
                    description="Kontrollera vem som kan se din profil"
                />
                <SettingsLink
                    href="/app/profil/installningar/aktiviteter"
                    icon={Calendar}
                    title="Aktivitetsinställningar"
                    description="Standardvy, filter och preferenser"
                />
                <SettingsLink
                    href="/app/profil/installningar/utseende"
                    icon={Palette}
                    title="Utseende"
                    description="Tema, typsnitt och tillgänglighet"
                />
            </div>
        </div>
    );
}

function SettingsLink({ href, icon: Icon, title, description }: any) {
    return (
        <Link href={href} className="block group">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
        </Link>
    );
}
