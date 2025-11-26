import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata = {
  title: "Integritetspolicy | Noisify",
  description: "Hur vi hanterar dina personuppgifter på Noisify.",
};

export default function IntegritetspolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-slate-900">Integritetspolicy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="lead text-xl text-slate-600 mb-8">
            Din integritet är viktig för oss. Denna policy förklarar hur Noisify samlar in, använder och skyddar dina personuppgifter.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Personuppgiftsansvarig</h2>
          <p className="mb-4">
            Noisify AB är personuppgiftsansvarig för behandlingen av dina personuppgifter på denna plattform.
            Fritidsgårdar och organisationer som använder plattformen är personuppgiftsansvariga för den specifika verksamhetsdata de hanterar.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Vilka uppgifter vi samlar in</h2>
          <p className="mb-4">Vi samlar in följande information när du använder Noisify:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Kontoinformation:</strong> E-postadress, användarnamn (alias), födelseår och lösenord.</li>
            <li><strong>Profiluppgifter:</strong> Information du väljer att lägga till i din profil.</li>
            <li><strong>Aktivitetsdata:</strong> Anmälningar till aktiviteter, kurser och evenemang.</li>
            <li><strong>Kommunikation:</strong> Meddelanden och notiser inom plattformen.</li>
            <li><strong>Teknisk data:</strong> IP-adress, webbläsartyp och enhetsinformation för säkerhet och loggning.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Hur vi använder dina uppgifter</h2>
          <p className="mb-4">Vi använder informationen för att:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Tillhandahålla och administrera ditt konto.</li>
            <li>Möjliggöra anmälningar till fritidsgårdsaktiviteter.</li>
            <li>Verifiera din ålder för åldersbegränsade aktiviteter (10-20 år).</li>
            <li>Kommunicera med dig om dina anmälningar och viktig information.</li>
            <li>Förbättra och utveckla våra tjänster.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Rättslig grund</h2>
          <p className="mb-4">
            Vi behandlar dina personuppgifter baserat på fullgörande av avtal (användarvillkoren) när du skapar ett konto och använder tjänsten. 
            För viss statistik och utveckling lutar vi oss mot berättigat intresse.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Dina rättigheter</h2>
          <p className="mb-4">Enligt GDPR har du rätt att:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Få tillgång till dina personuppgifter (registerutdrag).</li>
            <li>Begära rättelse av felaktiga uppgifter.</li>
            <li>Begära radering av dina uppgifter (&quot;rätten att bli bortglömd&quot;).</li>
            <li>Invända mot behandling av dina uppgifter.</li>
            <li>Få ut dina uppgifter i ett maskinläsbart format (dataportabilitet).</li>
          </ul>
          <p className="mb-4">
            Du kan utöva dessa rättigheter direkt via dina profilinställningar eller genom att kontakta oss.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Kontakt</h2>
          <p className="mb-4">
            Om du har frågor om vår personuppgiftsbehandling kan du kontakta oss på:
            <br />
            <strong>E-post:</strong> privacy@noisify.se
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
