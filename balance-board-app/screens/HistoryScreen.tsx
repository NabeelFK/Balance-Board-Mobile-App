import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BalanceHeader from "../components/BalanceHeader";

export default function HistoryScreen() {
  return (
    <View style={styles.screen}>
      <BalanceHeader />
      <View style={styles.content}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.sub}>Your past decisions will show here.</Text>
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
  title: { fontSize: 22, fontWeight: "800", color: TEXT, marginBottom: 10 },
  sub: { fontSize: 14, color: MUTED },
});
