import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-xl mb-4">Noisify</h3>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">För besökare</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/" className="hover:text-indigo-600">Hem</Link></li>
              <li><Link href="/aktiviteter" className="hover:text-indigo-600">Aktiviteter</Link></li>
              <li><Link href="/organisationer" className="hover:text-indigo-600">Fritidsgårdar</Link></li>
              <li><Link href="#" className="hover:text-indigo-600 flex items-center gap-1">Musik Studios <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Nytt</span></Link></li>
              <li><Link href="#" className="hover:text-indigo-600 flex items-center gap-1">Kurser <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Nytt</span></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">För organisationer</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/for-organisationer" className="hover:text-indigo-600">Information</Link></li>
              <li><Link href="/for-organisationer/registrera" className="hover:text-indigo-600">Bli kund</Link></li>
              <li><Link href="/login" className="hover:text-indigo-600">Logga In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Om Noisify</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="#" className="hover:text-indigo-600">Om Oss</Link></li>
              <li><Link href="#" className="hover:text-indigo-600">Partner</Link></li>
              <li><Link href="#" className="hover:text-indigo-600">Kontakt</Link></li>
              <li><Link href="#" className="hover:text-indigo-600">Press & Media</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/integritetspolicy" className="hover:text-indigo-600">Integritetspolicy</Link></li>
              <li><Link href="/anvandarvillkor" className="hover:text-indigo-600">Användarvillkor</Link></li>
              <li><Link href="/cookies" className="hover:text-indigo-600">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2025 Noisify av Incrane. Alla rättigheter reserverade.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-900">Twitter</Link>
            <Link href="#" className="hover:text-slate-900">LinkedIn</Link>
            <Link href="#" className="hover:text-slate-900">Instagram</Link>
            <Link href="#" className="hover:text-slate-900">Facebook</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
