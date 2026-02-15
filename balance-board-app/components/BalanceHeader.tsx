import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native";

export default function BalanceHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + - 12 }]}>
      <Image
        source={require("../assets/balance_board.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const TEXT = "#0A5E62";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
  },
});
