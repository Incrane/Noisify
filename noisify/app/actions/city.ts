'use server'

import { cookies } from 'next/headers'

interface SavedCity {
  id: string
  name: string
}

export async function setCityCookie(cityId: string, cityName: string) {
  const cookieStore = await cookies()
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  
  // Set the active city (viewing context)
  cookieStore.set('noisify_city_id', cityId, { expires })
  cookieStore.set('noisify_city_name', cityName, { expires })

  // Also ensure it's added to "My Cities" if list is empty or if we want to auto-save viewed cities
  // For now, let's say selecting a city *adds* it to saved cities if space permits
  await saveCity(cityId, cityName)
}

export async function saveCity(cityId: string, cityName: string) {
  const cookieStore = await cookies()
  const savedCitiesCookie = cookieStore.get('noisify_saved_cities')?.value
  let savedCities: SavedCity[] = []

  if (savedCitiesCookie) {
    try {
      savedCities = JSON.parse(savedCitiesCookie)
    } catch (e) {
      console.error("Failed to parse saved cities cookie", e)
      savedCities = []
    }
  }

  // Check if already exists
  const exists = savedCities.find(c => c.id === cityId)
  if (!exists) {
    // Max 3 cities
    if (savedCities.length >= 3) {
        // If full, we don't add automatically? Or do we replace the last one?
        // Requirement: "max limit for example 1 main city but 2 secondary"
        // Let's not auto-replace, user must remove one.
        // But for the "Select City" modal flow, if they have 0, we add.
        return { success: false, message: "You can only have 3 saved cities." }
    }
    savedCities.push({ id: cityId, name: cityName })
    
    cookieStore.set('noisify_saved_cities', JSON.stringify(savedCities), { 
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
    })
  }
  
  return { success: true }
}

export async function removeCity(cityId: string) {
    const cookieStore = await cookies()
    const savedCitiesCookie = cookieStore.get('noisify_saved_cities')?.value
    
    if (savedCitiesCookie) {
        let savedCities: SavedCity[] = JSON.parse(savedCitiesCookie)
        savedCities = savedCities.filter(c => c.id !== cityId)
        
        cookieStore.set('noisify_saved_cities', JSON.stringify(savedCities), { 
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
        })
    }
}

export async function getSavedCities(): Promise<SavedCity[]> {
    const cookieStore = await cookies()
    const savedCitiesCookie = cookieStore.get('noisify_saved_cities')?.value
    if (!savedCitiesCookie) return []
    try {
        return JSON.parse(savedCitiesCookie)
    } catch {
        return []
    }
}
