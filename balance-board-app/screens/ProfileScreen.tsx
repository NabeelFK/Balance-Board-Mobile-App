import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from "react-native";
import BalanceHeader from "../components/BalanceHeader";
import { useClerk, useUser } from "@clerk/clerk-expo";

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.screen}>
      <BalanceHeader />

      <View style={styles.content}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarFallback}>
                {(user?.firstName?.[0] || "U").toUpperCase()}
              </Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {user?.fullName || user?.firstName || "User"}
            </Text>
            <Text style={styles.sub}>
              {user?.primaryEmailAddress?.emailAddress || ""}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && { opacity: 0.85 },
            signingOut && { opacity: 0.6 },
          ]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
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

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },

  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(10,94,98,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10,94,98,0.18)",
  },
  avatar: { width: 54, height: 54 },
  avatarFallback: { color: TEXT, fontWeight: "900", fontSize: 18 },

  title: { fontSize: 20, fontWeight: "900", color: TEXT },
  sub: { fontSize: 13, color: MUTED, marginTop: 2 },

  signOutButton: {
    marginTop: 10,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  signOutText: { color: "#fff", fontWeight: "800" },
});
