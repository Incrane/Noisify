import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata = {
  title: "Om Cookies | Noisify",
  description: "Information om hur Noisify använder cookies.",
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-slate-900">Om Cookies</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="lead text-xl text-slate-600 mb-8">
            Vi använder cookies för att förbättra din upplevelse på Noisify. Här förklarar vi vad cookies är och vilka vi använder.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Vad är cookies?</h2>
          <p className="mb-4">
            Cookies är små textfiler som sparas på din dator eller mobil när du besöker en webbplats. De används för att komma ihåg dina inställningar och inloggning.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Vilka cookies använder vi?</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-2">Nödvändiga cookies</h3>
          <p className="mb-4">
            Dessa cookies är nödvändiga för att webbplatsen ska fungera säkert och korrekt. De kan inte stängas av.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Autentisering:</strong> Håller dig inloggad när du navigerar mellan sidor (Supabase Auth).</li>
            <li><strong>Säkerhet:</strong> Skyddar mot obehörig åtkomst och förfalskning av förfrågningar.</li>
            <li><strong>Preferenser:</strong> Sparar dina valda städer och filtreringar.</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-2">Analyscookies</h3>
          <p className="mb-4">
            Vi använder begränsad, anonym statistik för att se hur många som besöker plattformen och vilka sidor som är populärast. Detta hjälper oss att förbättra tjänsten.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Hantera cookies</h2>
          <p className="mb-4">
            Eftersom vi främst använder nödvändiga cookies för funktion och säkerhet, behövs dessa för att du ska kunna använda tjänsten (t.ex. logga in och anmäla dig).
            Du kan ställa in din webbläsare att blockera alla cookies, men då kommer delar av Noisify inte att fungera.
          </p>

          <p className="text-sm text-slate-500 mt-12 border-t pt-4">
            Senast uppdaterad: 2023-11-24
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
