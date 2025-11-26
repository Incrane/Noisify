import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import { 
  BarChart3, 
  Zap, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Smartphone,
  ArrowRight
} from "lucide-react";
import { getLayoutData } from "@/lib/get-layout-data";
import Link from "next/link";

export default async function ForOrganizationsPage() {
  const { cities, cityName, savedCities } = await getLayoutData();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />

      <main>
        {/* Hero Section */}
        <section className="relative bg-slate-900 text-white overflow-hidden">
          {/* Abstract Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          </div>

          <div className="container relative mx-auto px-4 py-24 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 border border-indigo-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Nu tillgängligt för alla kommuner
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
                Framtidens plattform för <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
                  ungdomsverksamhet
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
                Noisify hjälper fritidsgårdar och kulturskolor att nå fler ungdomar, 
                automatisera administrationen och skapa en tryggare mötesplats.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/for-organisationer/registrera" 
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
                >
                  Kom igång gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#features" 
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Läs mer om funktioner
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats / Trust Section */}
        <section className="py-12 border-b border-slate-100 bg-slate-50">
          <div className="container mx-auto px-4">
            <p className="text-center text-slate-500 font-medium mb-8">En plattform designad för moderna verksamheter</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for "Trusted By" logos - using text for now */}
              <div className="flex items-center justify-center font-bold text-xl text-slate-400">GÖTEBORGS STAD</div>
              <div className="flex items-center justify-center font-bold text-xl text-slate-400">KULTURSKOLAN</div>
              <div className="flex items-center justify-center font-bold text-xl text-slate-400">UNGDOMSSATSNINGEN</div>
              <div className="flex items-center justify-center font-bold text-xl text-slate-400">FRITID VÄST</div>
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Allt ni behöver för att driva verksamheten</h2>
              <p className="text-xl text-slate-600">
                Från planering till uppföljning. Noisify ger er verktygen för att fokusera på det viktiga - ungdomarna.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                  <Calendar className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Aktivitetshantering</h3>
                <p className="text-slate-600 leading-relaxed">
                  Skapa och publicera aktiviteter på minuter. Hantera anmälningar, kölistor och incheckningar digitalt.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100">
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-600 transition-colors">
                  <Smartphone className="w-7 h-7 text-pink-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Mobil-first för unga</h3>
                <p className="text-slate-600 leading-relaxed">
                  Möt ungdomarna där de är. En modern app-upplevelse som gör det enkelt att hitta och boka aktiviteter.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <BarChart3 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Statistik & Uppföljning</h3>
                <p className="text-slate-600 leading-relaxed">
                  Få automatiska rapporter om besökare, könsfördelning och populära aktiviteter. Inget mer manuellt räknande.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                  <ShieldCheck className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Trygghet & Säkerhet</h3>
                <p className="text-slate-600 leading-relaxed">
                  Full kontroll på vilka som är i lokalen. GDPR-säkert medlemsregister och verifierade konton.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                  <Users className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Digitalt Medlemskort</h3>
                <p className="text-slate-600 leading-relaxed">
                  Inga fler borttappade plastkort. Medlemskapet finns alltid i mobilen, redo att visas upp.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-600 transition-colors">
                  <Zap className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Kom igång direkt</h3>
                <p className="text-slate-600 leading-relaxed">
                  Inga långa installationer. Molnbaserat och redo att användas direkt i webbläsaren.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA / Onboarding Section */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay"></div>
          
          <div className="container relative mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Redo att ta nästa steg?</h2>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                Anslut er organisation idag och upplev skillnaden. Det är gratis att testa och vi hjälper er att komma igång.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/for-organisationer/registrera" 
                  className="px-10 py-5 bg-white text-indigo-900 font-bold text-lg rounded-full hover:bg-indigo-50 transition-colors shadow-xl"
                >
                  Registrera organisation
                </Link>
                <Link 
                  href="mailto:kontakt@noisify.se" 
                  className="px-10 py-5 bg-indigo-600 text-white font-bold text-lg rounded-full hover:bg-indigo-500 transition-colors shadow-xl border border-indigo-500"
                >
                  Kontakta säljare
                </Link>
              </div>
              
              <p className="mt-8 text-sm text-slate-400">
                Har du redan ett konto? <Link href="/login" className="text-white underline hover:text-indigo-200">Logga in här</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
