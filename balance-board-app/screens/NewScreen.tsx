import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BalanceHeader from "../components/BalanceHeader";

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";

export default function NewScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.screen}>
      <BalanceHeader />

      <View style={styles.content}>
        <Text style={styles.title}>Need help making a{`\n`}decision?</Text>
        <Text style={styles.sub}>Start a new decision and we’ll guide you through it.</Text>

        <Pressable
          onPress={() => navigation.navigate("Chat")}
          style={({ pressed }) => [
            styles.btn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={styles.btnText}>Start new decision</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 48,
  },

  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 10,
    textAlign: "center",
  },

  sub: {
    fontSize: 15,
    color: MUTED,
    marginBottom: 18,
    textAlign: "center",
  },

  btn: {
    backgroundColor: TEXT,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 520,
    marginTop: 18,
  },

  btnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
  },
});
