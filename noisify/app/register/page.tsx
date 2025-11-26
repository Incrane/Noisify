import Link from 'next/link'
import { register } from './actions'
import SiteHeader from '@/components/landing/site-header'
import { getLayoutData } from '@/lib/get-layout-data'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const params = await searchParams
  const { cities, cityName, savedCities } = await getLayoutData()

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center">
            <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Skapa konto</h2>
            <p className="mt-2 text-slate-600">
              Bli medlem i Noisify för att boka aktiviteter
            </p>
          </div>

          <form className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="alias" className="block text-sm font-medium text-slate-700">
                  Användarnamn (Alias)
                </label>
                <input
                  id="alias"
                  name="alias"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="T.ex. SkatePro2025"
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
                  Födelsedatum
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Du måste vara mellan 10-20 år (född 2005-2015)
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-postadress
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="namn@exempel.se"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Lösenord
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Minst 6 tecken"
                />
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="gdpr"
                    name="gdpr"
                    type="checkbox"
                    required
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="gdpr" className="font-medium text-slate-700">
                    Jag godkänner villkoren
                  </label>
                  <p className="text-slate-500">
                    Jag godkänner <Link href="/villkor" className="text-indigo-600 hover:text-indigo-500">användarvillkoren</Link> och att mina personuppgifter behandlas enligt <Link href="/integritet" className="text-indigo-600 hover:text-indigo-500">GDPR</Link>.
                  </p>
                </div>
              </div>
            </div>

            {params?.error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {params.error}
              </div>
            )}

            <button
              formAction={register}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Skapa konto
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-600">Har du redan ett konto? </span>
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Logga in här
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
