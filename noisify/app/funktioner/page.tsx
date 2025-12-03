import Link from "next/link";
import {
    Calendar,
    MapPin,
    Users,
    GraduationCap,
    Gamepad2,
    MessageCircle,
    BarChart3,
    Settings,
    CheckCircle,
    ArrowRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import CityModal from "@/components/landing/city-modal";
import { cookies } from "next/headers";
import { getSavedCities, setCityCookie, saveCity, removeCity } from "@/app/actions/city";

// Server Actions Wrappers
async function saveCityAction(cityId: string, cityName: string) {
    'use server'
    return await saveCity(cityId, cityName)
}

async function removeCityAction(cityId: string) {
    'use server'
    await removeCity(cityId)
}

async function selectCityAction(cityId: string, cityName: string) {
    'use server'
    await setCityCookie(cityId, cityName)
}

export const metadata = {
    title: "Funktioner - Noisify",
    description: "Upptäck alla funktioner i Noisify - från aktivitetshantering och lokalbokning till medlemsregister och statistik.",
};

const features = [
    {
        icon: Calendar,
        title: "Aktivitetshantering",
        description: "Skapa och hantera aktiviteter enkelt. Stöd för återkommande evenemang, anmälningslistor, väntelistor och riktade inbjudningar.",
        color: "bg-blue-100 text-blue-600",
    },
    {
        icon: MapPin,
        title: "Lokalbokning",
        description: "Ett komplett bokningssystem för era rum och studios. Hantera tillgänglighet, godkänn förfrågningar och sätt regler för vem som får boka.",
        color: "bg-orange-100 text-orange-600",
    },
    {
        icon: Users,
        title: "Medlemsregister",
        description: "Digitala medlemskort och enkel hantering av medlemmar. Håll koll på närvaro, medlemskap och behörigheter på ett ställe.",
        color: "bg-green-100 text-green-600",
    },
    {
        icon: GraduationCap,
        title: "Kurser & Utbildning",
        description: "Planera och genomför kurser över flera tillfällen. Hantera deltagare, närvaro och diplomering smidigt i plattformen.",
        color: "bg-purple-100 text-purple-600",
    },
    {
        icon: Gamepad2,
        title: "Live Quiz",
        description: "Engagera ungdomarna med interaktiva quiz. Skapa egna frågor eller använd färdiga mallar för en rolig och lärorik upplevelse.",
        color: "bg-pink-100 text-pink-600",
    },
    {
        icon: MessageCircle,
        title: "Chatt & Kommunikation",
        description: "Säker kommunikation med medlemmar. Skapa gruppchattar för specifika intressen eller kommunicera direkt med enskilda ungdomar.",
        color: "bg-indigo-100 text-indigo-600",
    },
    {
        icon: BarChart3,
        title: "Statistik & Insikter",
        description: "Få värdefulla insikter om er verksamhet. Se statistik över besökare, populära aktiviteter och beläggningsgrad i realtid.",
        color: "bg-cyan-100 text-cyan-600",
    },
    {
        icon: Settings,
        title: "Organisationsinställningar",
        description: "Skräddarsy plattformen efter era behov. Hantera personal, öppettider, kontaktuppgifter och mycket mer.",
        color: "bg-slate-100 text-slate-600",
    },
];

export default async function FeaturesPage() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const cityId = cookieStore.get("noisify_city_id")?.value;
    const cityName = cookieStore.get("noisify_city_name")?.value;
    const savedCities = await getSavedCities();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: citiesData } = await supabase
        .from("cities")
        .select("id, name:city")
        .eq("available", true);

    const cities = (citiesData as unknown as { id: string; name: string }[]) || [];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <SiteHeader
                cities={cities}
                selectedCityId={cityId}
                selectedCityName={cityName}
                savedCities={savedCities}
                user={user}
                onSelectCity={selectCityAction}
                onSaveCity={saveCityAction}
                onRemoveCity={removeCityAction}
            />

            {!cityId && <CityModal cities={cities} defaultOpen={true} />}

            <main>
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden bg-slate-50">
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                            Allt du behöver för att driva <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">
                                en modern fritidsgård
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Noisify samlar alla verktyg ni behöver på ett ställe. Från bokningar och aktiviteter till kommunikation och statistik – byggt för både personal och ungdomar.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/for-organisationer" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300">
                                Kom igång som organisation
                            </Link>
                            <Link href="/aktiviteter" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition-all shadow-sm hover:shadow-md">
                                Utforska aktiviteter
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="p-8 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-8">Redo att digitalisera er verksamhet?</h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Anslut er fritidsgård till Noisify idag och ge era ungdomar en bättre upplevelse. Det är helt gratis att komma igång.
                        </p>
                        <Link href="/for-organisationer" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20">
                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                            Registrera er organisation
                        </Link>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
