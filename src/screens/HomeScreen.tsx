import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ClimateSummary,
  getHistoricalClimate,
} from "../services/historyWeatherApi";
import { GeoCity, searchCities } from "../services/geocodingApi";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const starterCity: GeoCity = {
  id: 1,
  name: "Barcelona",
  country: "Spain",
  admin1: "Catalonia",
  latitude: 41.3874,
  longitude: 2.1686,
  timezone: "Europe/Madrid",
};

function cityLabel(city: GeoCity) {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 148,
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        padding: 14,
        gap: 6,
      }}
    >
      <View
        style={{
          width: 28,
          height: 3,
          borderRadius: 99,
          backgroundColor: accent,
        }}
      />
      <Text style={{ color: "#6B7280", fontSize: 13 }}>{label}</Text>
      <Text
        selectable
        style={{
          color: "#111827",
          fontSize: 22,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      {detail ? (
        <Text selectable style={{ color: "#6B7280", fontSize: 12 }}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<GeoCity>(starterCity);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [suggestions, setSuggestions] = useState<GeoCity[]>([]);
  const [summary, setSummary] = useState<ClimateSummary | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [error, setError] = useState("");

  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const selectedMonthName = months[selectedMonth - 1];

  useEffect(() => {
    let isActive = true;
    const handle = setTimeout(async () => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length < 2) {
        setSuggestions([]);
        setSearching(false);
        return;
      }

      setSearching(true);

      try {
        const results = await searchCities(trimmedQuery);

        if (isActive) {
          setSuggestions(results);
          setError("");
        }
      } catch (searchError) {
        if (isActive) {
          setError(
            searchError instanceof Error
              ? searchError.message
              : "City search failed"
          );
        }
      } finally {
        if (isActive) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    let isActive = true;

    async function loadClimate() {
      setLoadingWeather(true);
      setError("");

      try {
        const climate = await getHistoricalClimate(
          selectedCity.latitude,
          selectedCity.longitude,
          selectedMonth
        );

        if (isActive) {
          setSummary(climate);
        }
      } catch (weatherError) {
        if (isActive) {
          setSummary(null);
          setError(
            weatherError instanceof Error
              ? weatherError.message
              : "Weather data failed"
          );
        }
      } finally {
        if (isActive) {
          setLoadingWeather(false);
        }
      }
    }

    loadClimate();

    return () => {
      isActive = false;
    };
  }, [selectedCity, selectedMonth]);

  const metricRows = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Daytime average",
        value: `${summary.averageDay}C`,
        detail: "Typical daily high",
        accent: "#F97316",
      },
      {
        label: "Night average",
        value: `${summary.averageNight}C`,
        detail: "Typical overnight low",
        accent: "#2563EB",
      },
      {
        label: "Rain probability",
        value: `${summary.rainProbability}%`,
        detail: `${summary.precipitation} mm on an average day`,
        accent: "#0EA5E9",
      },
      {
        label: "Wind speed",
        value: `${summary.windSpeed} km/h`,
        detail: "Average daily max",
        accent: "#64748B",
      },
      {
        label: "Cloud coverage",
        value: `${summary.cloudCoverage}%`,
        detail: summary.condition,
        accent: "#6B7280",
      },
      {
        label: "Typical range",
        value: `${summary.typicalLow}C to ${summary.typicalHigh}C`,
        detail: "Observed across the sample",
        accent: "#10B981",
      },
    ];
  }, [summary]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{
        paddingTop: (StatusBar.currentHeight ?? 0) + 24,
        paddingBottom: 32,
        paddingHorizontal: 20,
        gap: 18,
        maxWidth: 920,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={{ gap: 6 }}>
        <Text style={{ color: "#475569", fontSize: 14, fontWeight: "600" }}>
          Travel Weather Planner
        </Text>
        <Text
          style={{
            color: "#0F172A",
            fontSize: 34,
            fontWeight: "800",
            lineHeight: 40,
          }}
        >
          Plan around typical weather, not today's forecast.
        </Text>
        <Text style={{ color: "#64748B", fontSize: 15, lineHeight: 22 }}>
          Search a destination and choose a travel month to see historical
          weather patterns from Open-Meteo.
        </Text>
      </View>

      <View
        style={{
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          padding: 14,
          gap: 12,
        }}
      >
        <Text style={{ color: "#111827", fontSize: 15, fontWeight: "700" }}>
          Destination
        </Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          placeholder="Search city, for example Tokyo"
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          style={{
            minHeight: 48,
            borderRadius: 8,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#CBD5E1",
            paddingHorizontal: 14,
            color: "#0F172A",
            fontSize: 16,
            backgroundColor: "#FFFFFF",
          }}
        />

        {searching ? <ActivityIndicator color="#0F766E" /> : null}

        {suggestions.length > 0 ? (
          <View style={{ gap: 8 }}>
            {suggestions.map((city) => (
              <Pressable
                key={`${city.id}-${city.latitude}-${city.longitude}`}
                onPress={() => {
                  setSelectedCity(city);
                  setQuery("");
                  setSuggestions([]);
                }}
                style={({ pressed }) => ({
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: pressed ? "#0F766E" : "#E2E8F0",
                  backgroundColor: pressed ? "#ECFDF5" : "#F8FAFC",
                  padding: 12,
                })}
              >
                <Text
                  selectable
                  style={{ color: "#0F172A", fontSize: 15, fontWeight: "700" }}
                >
                  {city.name}
                </Text>
                <Text selectable style={{ color: "#64748B", fontSize: 13 }}>
                  {cityLabel(city)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: "#111827", fontSize: 15, fontWeight: "700" }}>
          Travel month
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {months.map((month, index) => {
            const monthNumber = index + 1;
            const isSelected = monthNumber === selectedMonth;

            return (
              <Pressable
                key={month}
                onPress={() => setSelectedMonth(monthNumber)}
                style={{
                  minHeight: 38,
                  minWidth: isWide ? 104 : 94,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: isSelected ? "#0F766E" : "#CBD5E1",
                  backgroundColor: isSelected ? "#0F766E" : "#FFFFFF",
                  paddingHorizontal: 10,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#FFFFFF" : "#334155",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {month.slice(0, 3)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor: "#0F172A",
          padding: 18,
          gap: 8,
        }}
      >
        <Text style={{ color: "#BAE6FD", fontSize: 13, fontWeight: "700" }}>
          {selectedMonthName} in {selectedCity.name}
        </Text>
        <Text selectable style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800" }}>
          {loadingWeather
            ? "Loading historical weather..."
            : summary?.condition ?? "No climate data available"}
        </Text>
        <Text selectable style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 20 }}>
          Based on historical Open-Meteo archive data from{" "}
          {summary?.years ?? "recent years"}.
        </Text>
      </View>

      {error ? (
        <View
          style={{
            borderRadius: 8,
            borderCurve: "continuous",
            backgroundColor: "#FEF2F2",
            borderWidth: 1,
            borderColor: "#FECACA",
            padding: 14,
          }}
        >
          <Text selectable style={{ color: "#991B1B", fontSize: 14 }}>
            {error}
          </Text>
        </View>
      ) : null}

      {loadingWeather ? (
        <View style={{ padding: 28 }}>
          <ActivityIndicator color="#0F766E" />
        </View>
      ) : null}

      {summary ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {metricRows.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </View>

          <View
            style={{
              borderRadius: 8,
              borderCurve: "continuous",
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              padding: 14,
              gap: 14,
            }}
          >
            <Text style={{ color: "#111827", fontSize: 15, fontWeight: "700" }}>
              Typical hourly temperature
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              {summary.hourlyPattern.map((item) => {
                const temperatures = summary.hourlyPattern.map(
                  (point) => point.temperature
                );
                const min = Math.min(...temperatures);
                const max = Math.max(...temperatures);
                const range = Math.max(max - min, 1);
                const height = 42 + ((item.temperature - min) / range) * 74;

                return (
                  <View
                    key={item.hour}
                    style={{ flex: 1, alignItems: "center", gap: 6 }}
                  >
                    <Text
                      selectable
                      style={{
                        color: "#0F172A",
                        fontSize: 12,
                        fontWeight: "700",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {item.temperature}C
                    </Text>
                    <View
                      style={{
                        width: "100%",
                        maxWidth: 34,
                        height,
                        borderRadius: 6,
                        borderCurve: "continuous",
                        backgroundColor: "#38BDF8",
                      }}
                    />
                    <Text
                      style={{
                        color: "#64748B",
                        fontSize: 11,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {formatHour(item.hour)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
