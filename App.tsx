import { useState } from "react";
import { cities } from "./src/data/cities";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";



export default function App() {
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [results, setResults] = useState(cities);

  const searchCities = () => {
    const min = Number(minTemp);
    const max = Number(maxTemp);

    const filtered = cities.filter(
      (city) => city.temp >= min && city.temp <= max
    );

    setResults(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather City Finder</Text>

      <TextInput
        style={styles.input}
        placeholder="Min temperatur"
        keyboardType="numeric"
        value={minTemp}
        onChangeText={setMinTemp}
      />

      <TextInput
        style={styles.input}
        placeholder="Max temperatur"
        keyboardType="numeric"
        value={maxTemp}
        onChangeText={setMaxTemp}
      />

      <Button title="Sök" onPress={searchCities} />

<Text style={styles.resultCount}>
  Hittade {results.length} städer
</Text>

      <FlatList
        style={{ marginTop: 20, width: "100%" }}
        data={results}
        keyExtractor={(item) => item.name}
       renderItem={({ item }) => (
  <Text style={styles.city}>
    {item.name}, {item.country} - {item.temp}°C
  </Text>
)}
      />
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