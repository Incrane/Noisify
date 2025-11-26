import Link from 'next/link'
import SiteHeader from '@/components/landing/site-header'
import SiteFooter from '@/components/site-footer'
import { getLayoutData } from '@/lib/get-layout-data'
import { Home, Search } from 'lucide-react'

export default async function NotFound() {
  const { cities, cityName, savedCities } = await getLayoutData().catch(() => ({
    cities: [],
    cityName: undefined,
    savedCities: [],
    cityId: undefined
  }))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
            <div className="relative">
                <h1 className="text-[150px] font-black text-indigo-100 leading-none select-none">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">
                        Sidan hittades inte
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Hoppsan! Du verkar ha gått vilse.</h2>
                <p className="text-lg text-slate-600 max-w-lg mx-auto">
                    Sidan du letar efter verkar inte finnas kvar, eller så har den flyttat.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 hover:shadow-lg"
                >
                    <Home className="w-4 h-4" />
                    Gå till startsidan
                </Link>
                <Link 
                    href="/aktiviteter" 
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    Hitta aktiviteter
                </Link>
            </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
