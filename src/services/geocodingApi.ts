export type GeoCity = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type GeocodingResponse = {
  results?: GeoCity[];
};

export async function searchCities(cityName: string): Promise<GeoCity[]> {
  const query = cityName.trim();

  if (query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    format: "json",
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`City search failed with status ${response.status}`);
  }

  const data = (await response.json()) as GeocodingResponse;

  return data.results ?? [];
}
