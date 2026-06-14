export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  date: string
) {
  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=auto`
  );

  const data = await response.json();

  return {
    max: data.daily.temperature_2m_max[0],
    min: data.daily.temperature_2m_min[0],
    mean: data.daily.temperature_2m_mean[0],
  };
}