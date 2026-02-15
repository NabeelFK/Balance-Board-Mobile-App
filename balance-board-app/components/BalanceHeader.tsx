import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BalanceHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <Text style={styles.logoText}>Balance</Text>
      <View style={styles.logoBadge}>
        <Text style={styles.logoBadgeText}>?</Text>
      </View>
    </View>
  );
}

const TEXT = "#0A5E62";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  logoText: { fontSize: 20, fontWeight: "700", color: TEXT, letterSpacing: 0.3 },
  logoBadge: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: "#9EE3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: { color: TEXT, fontWeight: "800", fontSize: 12, marginTop: -1 },
});
