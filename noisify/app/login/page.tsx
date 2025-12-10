import Link from 'next/link'
import { login } from './actions'
import SiteHeader from '@/components/landing/site-header'
import { getLayoutData } from '@/lib/get-layout-data'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  let layoutData: any = { cities: [], cityName: undefined, savedCities: [] };
  try {
    layoutData = await getLayoutData()
  } catch (error) {
    console.error("Error in getLayoutData:", error);
  }
  const { cities, cityName, savedCities } = layoutData;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center">
            <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Logga in</h2>
            <p className="mt-2 text-slate-600">
              Välkommen tillbaka till Noisify
            </p>
          </div>

          <form className="mt-8 space-y-6" action={login}>
            <div className="space-y-4">
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
                  suppressHydrationWarning
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
                  autoComplete="current-password"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                  suppressHydrationWarning
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    suppressHydrationWarning
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                    Kom ihåg mig
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    href="/glomt-losenord"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Glömt lösenordet?
                  </Link>
                </div>
              </div>
            </div>

            {searchParams?.error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {searchParams.error}
              </div>
            )}

            {searchParams?.message && (
              <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm">
                {searchParams.message}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Logga in
              </button>
            </div>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-600">Har du inget konto? </span>
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Registrera dig här
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
