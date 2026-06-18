export type HourlyPattern = {
  hour: number;
  temperature: number;
};

export type ClimateSummary = {
  averageDay: number;
  averageNight: number;
  typicalHigh: number;
  typicalLow: number;
  rainProbability: number;
  precipitation: number;
  windSpeed: number;
  cloudCoverage: number;
  condition: string;
  hourlyPattern: HourlyPattern[];
  years: string;
};

type ArchiveResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    cloud_cover?: number[];
  };
};

const CLIMATE_YEARS = [2021, 2022, 2023, 2024, 2025];

const conditionLabels: Record<number, string> = {
  0: "Mostly clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Light rain",
  63: "Rainy",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snowy",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorms",
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  return { start, end };
}

function mostCommonCondition(codes: number[]) {
  const counts = new Map<number, number>();

  codes.forEach((code) => {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  });

  const [code] =
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];

  return conditionLabels[code] ?? "Mixed conditions";
}

async function fetchArchiveYear(
  latitude: number,
  longitude: number,
  month: number,
  year: number
) {
  const { start, end } = monthRange(year, month);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: start,
    end_date: end,
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    hourly: "temperature_2m,cloud_cover",
    timezone: "auto",
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Historical weather failed with status ${response.status}`);
  }

  return (await response.json()) as ArchiveResponse;
}

export async function getHistoricalClimate(
  latitude: number,
  longitude: number,
  month: number
): Promise<ClimateSummary> {
  const archives = await Promise.all(
    CLIMATE_YEARS.map((year) =>
      fetchArchiveYear(latitude, longitude, month, year)
    )
  );

  const maxTemps = archives.flatMap(
    (archive) => archive.daily?.temperature_2m_max ?? []
  );
  const minTemps = archives.flatMap(
    (archive) => archive.daily?.temperature_2m_min ?? []
  );
  const precipitation = archives.flatMap(
    (archive) => archive.daily?.precipitation_sum ?? []
  );
  const wind = archives.flatMap(
    (archive) => archive.daily?.wind_speed_10m_max ?? []
  );
  const conditions = archives.flatMap(
    (archive) => archive.daily?.weather_code ?? []
  );
  const cloud = archives.flatMap((archive) => archive.hourly?.cloud_cover ?? []);

  const hourlyBuckets = new Map<number, number[]>();

  archives.forEach((archive) => {
    const times = archive.hourly?.time ?? [];
    const temperatures = archive.hourly?.temperature_2m ?? [];

    times.forEach((time, index) => {
      const hour = Number(time.slice(11, 13));
      const bucket = hourlyBuckets.get(hour) ?? [];
      const temperature = temperatures[index];

      if (Number.isFinite(temperature)) {
        bucket.push(temperature);
        hourlyBuckets.set(hour, bucket);
      }
    });
  });

  return {
    averageDay: round(average(maxTemps), 1),
    averageNight: round(average(minTemps), 1),
    typicalHigh: round(Math.max(...maxTemps), 1),
    typicalLow: round(Math.min(...minTemps), 1),
    rainProbability: round(
      (precipitation.filter((value) => value > 0.2).length /
        Math.max(precipitation.length, 1)) *
        100
    ),
    precipitation: round(average(precipitation), 1),
    windSpeed: round(average(wind), 1),
    cloudCoverage: round(average(cloud)),
    condition: mostCommonCondition(conditions),
    hourlyPattern: [0, 3, 6, 9, 12, 15, 18, 21].map((hour) => ({
      hour,
      temperature: round(average(hourlyBuckets.get(hour) ?? []), 1),
    })),
    years: `${CLIMATE_YEARS[0]}-${CLIMATE_YEARS[CLIMATE_YEARS.length - 1]}`,
  };
}
