import { createClient } from "@/utils/supabase/server";
import { Calendar, Clock, Users, ArrowLeft, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import { getLayoutData } from "@/lib/get-layout-data";

export default async function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { cities, cityName, savedCities } = await getLayoutData();

  // 1. Get Course
  const { data: course } = await supabase
    .from("course_dashboard")
    .select("*")
    .eq("course_id", id)
    .single();

  if (!course) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />
            <main className="flex-1 container mx-auto px-4 py-12 text-center">
                 <h1 className="text-2xl font-bold text-slate-900">Kursen hittades inte</h1>
                 <Link href="/kurser" className="text-indigo-600 hover:underline mt-4 inline-block">Tillbaka till kurser</Link>
            </main>
            <SiteFooter />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link
            href="/kurser"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till kurser
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="relative h-64 md:h-80 bg-slate-100">
              {course.image_url ? (
                <Image
                  src={course.image_url}
                  alt={course.kursnamn}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-wider">
                  Kurs
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.kursnamn}</h1>
                <p className="text-lg text-slate-600">{course.agande_organisation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Clock className="w-4 h-4" /> Längd
                    </div>
                    <p className="font-medium text-slate-900">
                        {course.langd_timmar ? `${course.langd_timmar} timmar` : "Ej angivet"}
                    </p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Users className="w-4 h-4" /> Deltagare
                    </div>
                    <p className="font-medium text-slate-900">
                        {course.antal_inskrivna || 0} anmälda
                    </p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" /> Skapad
                    </div>
                    <p className="font-medium text-slate-900">
                        {new Date(course.skapad_datum).toLocaleDateString('sv-SE')}
                    </p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Om kursen</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {course.beskrivning || "Ingen beskrivning."}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-8">
                 <div className="bg-indigo-50 rounded-xl p-6 text-center space-y-4">
                     <h3 className="text-lg font-bold text-indigo-900">Vill du gå denna kurs?</h3>
                     <p className="text-indigo-700">Du måste ha ett konto för att anmäla dig.</p>
                     <div className="flex flex-col sm:flex-row gap-4 justify-center">
                         <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                             Logga in
                         </Link>
                         <Link href="/register" className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-full hover:bg-indigo-50 transition-colors shadow-sm border border-indigo-200">
                             Skapa konto
                         </Link>
                     </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
