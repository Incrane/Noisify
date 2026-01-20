import { createClient } from "@/utils/supabase/server";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, Users } from "lucide-react";
import { getLayoutData } from "@/lib/get-layout-data";

export const revalidate = 60; // Cache for 60 seconds

interface Course {
  course_id: string;
  kursnamn: string;
  agande_organisation: string;
  image_url: string | null;
  langd_timmar: number | null;
  antal_inskrivna: number | null;
  status: string;
  beskrivning: string | null; // Assuming this exists
}

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = params.q;
  const { cities, cityName, savedCities, cityId } = await getLayoutData();

  let dbQuery = supabase
    .from("course_dashboard")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("skapad_datum", { ascending: false });

  if (cityId) {
    const { data: orgs } = await supabase.from("organizations").select("id").eq("city_id", cityId);
    const orgIds = orgs?.map(o => o.id) || [];
    
    if (orgIds.length > 0) {
        dbQuery = dbQuery.in("agande_org_id", orgIds);
    } else {
        dbQuery = dbQuery.eq("agande_org_id", "00000000-0000-0000-0000-000000000000");
    }
  }

  if (query) {
    dbQuery = dbQuery.ilike("kursnamn", `%${query}%`);
  }

  const { data: courses, error } = await dbQuery;

  if (error) {
    console.error("Error fetching courses:", error);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Utveckla dina talanger
          </h1>
          <p className="text-lg text-slate-600">
            Hitta kurser inom musik, konst, sport och mycket mer på fritidsgårdarna.
          </p>
        </div>

        {/* Reusing SearchFilters might be okay if it only has text search, or we can make a simple input */}
        <div className="max-w-md mx-auto mb-12">
             <form className="relative">
                <input 
                    name="q" 
                    defaultValue={query} 
                    placeholder="Sök kurser..." 
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <BookOpen className="w-4 h-4" />
                </button>
             </form>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: Course) => (
            <Link 
                key={course.course_id} 
                href={`/kurser/${course.course_id}`}
                className="group block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all hover:border-indigo-200"
            >
                <div className="relative h-48 bg-slate-100">
                    {course.image_url ? (
                        <Image 
                            src={course.image_url} 
                            alt={course.kursnamn} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                            <BookOpen className="w-12 h-12" />
                        </div>
                    )}
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-1">
                            {course.kursnamn}
                        </h3>
                        <p className="text-sm text-slate-500">{course.agande_organisation}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{course.langd_timmar ? `${course.langd_timmar}h` : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{course.antal_inskrivna || 0} deltagare</span>
                        </div>
                    </div>
                </div>
            </Link>
          ))}

          {courses?.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-500">
               Just nu finns inga publicerade kurser.
             </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
