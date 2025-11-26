import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getSavedCities } from "@/app/actions/city";

interface City {
  id: string;
  name: string;
}

export async function getLayoutData() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  
  const cityId = cookieStore.get("noisify_city_id")?.value;
  const cityName = cookieStore.get("noisify_city_name")?.value;
  const savedCities = await getSavedCities();

  // Fetch available cities from database
  const { data: citiesData, error: cityError } = await supabase
    .from("cities")
    .select("id, name:city")
    .eq("available", true);
  
  if (cityError) console.error("Error fetching cities:", cityError);
  
  const cities = (citiesData as unknown as City[]) || [];

  return {
    cities,
    cityId,
    cityName,
    savedCities
  };
}
