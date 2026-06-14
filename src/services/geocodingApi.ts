export async function searchCity(cityName: string) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`
    );

    console.log("Status:", response.status);

    const data = await response.json();

    console.log("Data:", data);

    return data.results?.[0];
  } catch (error) {
    console.error("API ERROR:", error);
    throw error;
  }
}