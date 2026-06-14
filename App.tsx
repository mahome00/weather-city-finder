import { useState } from "react";
import { cities } from "./src/data/cities";
import { getCurrentWeather } from "./src/services/weatherApi";
import { getHistoricalWeather } from "./src/services/historyWeatherApi";
import { searchCity } from "./src/services/geocodingApi";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";



export default function App() {
  const [selectedDate, setSelectedDate] = useState("");

const [historicalWeather, setHistoricalWeather] = useState<any>(null);
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [results, setResults] = useState(cities);
  const [cityName, setCityName] = useState("");
const [cityResult, setCityResult] = useState<any>(null);

 const searchCities = () => {
  const min = Number(minTemp);
  const max = Number(maxTemp);

  if (isNaN(min) || isNaN(max)) {
    alert("Ange giltiga temperaturer");
    return;
  }

  if (min > max) {
    alert("Min temperatur kan inte vara högre än max temperatur");
    return;
  }

 

  const filtered = cities.filter(
    (city) => city.temp >= min && city.temp <= max
  );

  setResults(filtered);
};


const handleCitySearch = async () => {
  try {
    const city = await searchCity(cityName);

    setCityResult(city);

    const weather = await getHistoricalWeather(
      city.latitude,
      city.longitude,
      selectedDate
    );

    setHistoricalWeather(weather);

  } catch (error) {
    console.error(error);
    alert("Kunde inte hämta väderdata");
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather City Finder</Text>

     <TextInput
  style={styles.input}
  placeholder="Skriv stad"
  value={cityName}
  onChangeText={setCityName}
/>
<TextInput
  style={styles.input}
  placeholder="Datum (YYYY-MM-DD)"
  value={selectedDate}
  onChangeText={setSelectedDate}
/>

<Button
  title="Hitta stad"
  onPress={handleCitySearch}
/>

     {cityResult && (
  <View style={{ marginTop: 20 }}>
    <Text>{cityResult.name}</Text>
    <Text>{cityResult.country}</Text>
    <Text>Lat: {cityResult.latitude}</Text>
    <Text>Lon: {cityResult.longitude}</Text>
  </View>
  
)}

{historicalWeather && (
  <View style={{ marginTop: 20 }}>
    <Text>Historiskt väder</Text>

    <Text>
      Max temperatur: {historicalWeather.max}°C
    </Text>

    <Text>
      Medel temperatur: {historicalWeather.mean}°C
    </Text>

    <Text>
      Min temperatur: {historicalWeather.min}°C
    </Text>
  </View>
)}

{temperature !== null && (
  <Text>
    Temperatur just nu: {temperature}°C
  </Text>
)}


      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 60,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000000",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  city: {
    fontSize: 18,
    paddingVertical: 6,
    color: "#000000",
  },
  resultCount: {
  marginTop: 20,
  marginBottom: 10,
  fontSize: 16,
  fontWeight: "600",
},
});