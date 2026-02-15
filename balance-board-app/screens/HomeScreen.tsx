import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useClerk, useUser, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

import { useSupabase } from "../providers/SupabaseProvider";



type Tab = "New" | "History" | "Progress" | "Profile";

export default function HomeScreen() {

  const supabase = useSupabase();

  const { signOut } = useClerk();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("New");
  const [prompt, setPrompt] = useState("");

  const canStart = useMemo(() => prompt.trim().length > 0, [prompt]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    // TODO: navigate to your decision flow screen
    // navigation.navigate("Chat", { prompt })
    console.log("Start decision with:", prompt);
  };

  const [profileId, setProfileId] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  
  useEffect(() => {
  async function testConnection() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    console.log("SUPABASE TEST DATA:", data);
    console.log("SUPABASE TEST ERROR:", error);
  }

  useEffect(() => {
  async function ensureProfile() {
    if (!user?.id) return;

    const displayName =
      user.fullName ||
      user.firstName ||
      user.primaryEmailAddress?.emailAddress ||
      "Anonymous";

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          clerk_user_id: user.id,
          display_name: displayName,
          avatar_url: user.imageUrl ?? null,
        },
        { onConflict: "clerk_user_id" }
      )
      .select("id, xp, coins")
      .single();

    console.log("UPSERT PROFILE:", data, error);

    if (!error && data) {
      setProfileId(data.id);
      setXp(Number(data.xp ?? 0));
      setCoins(Number(data.coins ?? 0));
    }
  }

  ensureProfile();
}, [user?.id]);


  testConnection();
}, []);


  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Balance</Text>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>?</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {activeTab === "New" && (
          <>
            <Text style={styles.title}>Need help making a{`\n`}decision?</Text>

            <View style={styles.inputWrap}>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Start new decision..."
                placeholderTextColor="#7AAFB1"
                style={styles.input}
                returnKeyType="go"
                onSubmitEditing={handleStart}
              />
            </View>

            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.primaryButton,
                !canStart && styles.primaryButtonDisabled,
                pressed && canStart && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.primaryButtonText}>Start</Text>
            </Pressable>
          </>
        )}

        {activeTab === "History" && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>History</Text>
            <Text style={styles.placeholderText}>Your past decisions will show here.</Text>
          </View>
        )}

        {activeTab === "Progress" && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>Progress</Text>
            <Text style={styles.placeholderText}>Tracking / stats will show here.</Text>
          </View>
        )}

        {activeTab === "Profile" && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>
              Welcome{user?.firstName ? `, ${user.firstName}` : ""} 👋
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleSignOut}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signOutText}>Sign out</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TabItem
          label="New"
          icon="sparkles-outline"
          active={activeTab === "New"}
          onPress={() => setActiveTab("New")}
        />
        <TabItem
          label="History"
          icon="time-outline"
          active={activeTab === "History"}
          onPress={() => setActiveTab("History")}
        />
        <TabItem
          label="Progress"
          icon="trending-up-outline"
          active={activeTab === "Progress"}
          onPress={() => setActiveTab("Progress")}
        />
        <TabItem
          label="Profile"
          icon="person-outline"
          active={activeTab === "Profile"}
          onPress={() => setActiveTab("Profile")}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function TabItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        <Ionicons name={icon} size={20} color={active ? "#0A5E62" : "#4F7F81"} />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";
const CARD = "#CDEEEE";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: {
    paddingTop: 28,
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

  content: { flex: 1, paddingHorizontal: 26, paddingTop: 34 },

  title: { fontSize: 26, lineHeight: 32, fontWeight: "500", color: TEXT, marginBottom: 18 },

  inputWrap: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#A7DEDB",
  },
  input: { fontSize: 14, color: TEXT },

  primaryButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#0A5E62",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryButtonDisabled: { opacity: 0.35 },
  primaryButtonText: { color: "white", fontWeight: "700" },

  bottomNav: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: "#BFE7E5",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabItem: { width: "23%", alignItems: "center", gap: 6 },
  tabIconWrap: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  tabIconWrapActive: { backgroundColor: "#BFEDEB" },
  tabLabel: { fontSize: 11, color: MUTED },
  tabLabelActive: { color: TEXT, fontWeight: "700" },

  placeholder: { gap: 10 },
  placeholderTitle: { fontSize: 20, fontWeight: "700", color: TEXT },
  placeholderText: { fontSize: 14, color: MUTED },

  signOutButton: {
    marginTop: 12,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  signOutText: { color: "#fff", fontWeight: "700" },
});
