import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata = {
  title: "Användarvillkor | Noisify",
  description: "Regler och villkor för användning av Noisify.",
};

export default function AnvandarvillkorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-slate-900">Användarvillkor</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="lead text-xl text-slate-600 mb-8">
            Välkommen till Noisify. Dessa villkor styr din användning av vår plattform. Genom att skapa ett konto godkänner du dessa villkor.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Tjänsten</h2>
          <p className="mb-4">
            Noisify är en digital plattform som förmedlar aktiviteter, evenemang och information från fritidsgårdar och ungdomsverksamheter till ungdomar.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Användarkonto och Ålder</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Tjänsten riktar sig till ungdomar mellan 10 och 20 år.</li>
            <li>Du ansvarar för att uppgifterna du anger (inklusive födelseår) är korrekta.</li>
            <li>Ditt konto är personligt och får inte överlåtas till någon annan.</li>
            <li>Du ansvarar för att hålla ditt lösenord hemligt.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Ordningsregler</h2>
          <p className="mb-4">När du använder Noisify och deltar i aktiviteter förbinder du dig att:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Vara trevlig och respektfull mot andra användare och personal.</li>
            <li>Inte ladda upp stötande, olagligt eller kränkande material.</li>
            <li>Följa de specifika regler som gäller på respektive fritidsgård.</li>
            <li>Inte missbruka bokningssystemet genom att boka platser du inte tänker utnyttja.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Avstängning</h2>
          <p className="mb-4">
            Noisify och anslutna organisationer förbehåller sig rätten att stänga av användare som bryter mot dessa villkor eller missköter sig i samband med aktiviteter.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Ansvarsbegränsning</h2>
          <p className="mb-4">
            Noisify förmedlar information från olika organisationer men ansvarar inte för genomförandet av aktiviteterna. Respektive arrangör ansvarar för säkerhet och innehåll på sina aktiviteter.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Ändringar av villkor</h2>
          <p className="mb-4">
            Vi kan komma att uppdatera dessa villkor. Vid väsentliga ändringar kommer vi att meddela dig via plattformen eller e-post.
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
