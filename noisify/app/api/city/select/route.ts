import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { cityId, cityName } = await request.json()

        if (!cityId || !cityName) {
            return NextResponse.json(
                { error: 'City ID and name are required' },
                { status: 400 }
            )
        }

        const cookieStore = await cookies()
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

        // Set the active city cookies
        cookieStore.set('noisify_city_id', cityId, { expires, path: '/' })
        cookieStore.set('noisify_city_name', cityName, { expires, path: '/' })

        // Handle saved cities
        const savedCitiesCookie = cookieStore.get('noisify_saved_cities')?.value
        let savedCities: Array<{ id: string; name: string }> = []

        if (savedCitiesCookie) {
            try {
                savedCities = JSON.parse(savedCitiesCookie)
            } catch (e) {
                console.error('Failed to parse saved cities cookie', e)
                savedCities = []
            }
        }

        // Add to saved cities if not already there and under limit
        const exists = savedCities.find((c) => c.id === cityId)
        if (!exists && savedCities.length < 3) {
            savedCities.push({ id: cityId, name: cityName })
            cookieStore.set('noisify_saved_cities', JSON.stringify(savedCities), {
                expires,
                path: '/',
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error setting city:', error)
        return NextResponse.json(
            { error: 'Failed to set city' },
            { status: 500 }
        )
    }
}
