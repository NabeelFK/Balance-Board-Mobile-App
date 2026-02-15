import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BalanceHeader from "../components/BalanceHeader";

export default function NewScreen() {
  const navigation = useNavigation<any>();
  const [starting, setStarting] = useState(false);

  const startNewDecision = () => {
    if (starting) return;
    setStarting(true);

    // small delay so it feels nicer
    setTimeout(() => {
      navigation.navigate("Chat");
      setStarting(false);
    }, 180);
  };

  return (
    <View style={styles.screen}>
      <BalanceHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Need help making a{`\n`}decision?</Text>
        <Text style={styles.sub}>You’ll put your chat / decision flow here.</Text>

        <Pressable
          onPress={startNewDecision}
          disabled={starting}
          style={({ pressed }) => [
            styles.startBtn,
            pressed && !starting && { opacity: 0.9 },
            starting && { opacity: 0.7 },
          ]}
        >
          {starting ? <ActivityIndicator /> : <Text style={styles.startText}>Start new decision</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { flex: 1, paddingHorizontal: 26, paddingTop: 22 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: "700", color: TEXT, marginBottom: 10 },
  sub: { fontSize: 14, color: MUTED, marginBottom: 18 },

  startBtn: {
    backgroundColor: TEXT,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  startText: { color: "white", fontWeight: "800", fontSize: 16 },
});