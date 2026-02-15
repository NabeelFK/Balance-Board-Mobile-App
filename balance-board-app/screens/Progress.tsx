import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClerk, useUser } from "@clerk/clerk-expo";
import * as Crypto from "expo-crypto";
import { useSupabase } from "../providers/SupabaseProvider";

type Tab = "New" | "History" | "Progress" | "Profile";

type LeaderRow = {
  profile_id: string;
  clerk_user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  coins: number;
  created_at: string;
};

export default function Progress() {
  const supabase = useSupabase();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<Tab>("Progress");

  // profile
  const [profileId, setProfileId] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  // profile tab signout loading
  const [signingOut, setSigningOut] = useState(false);

  const clerkUserId = user?.id ?? null;

  // 1) Ensure profile exists (UPSERT)
  useEffect(() => {
    let cancelled = false;

    async function ensureProfile() {
      if (!clerkUserId) return;

      setLoadingProfile(true);
      try {
        const displayName =
          user?.fullName ||
          user?.firstName ||
          user?.primaryEmailAddress?.emailAddress ||
          "Anonymous";

        const { data, error } = await supabase
          .from("profiles")
          .upsert(
            {
              clerk_user_id: clerkUserId,
              display_name: displayName,
              avatar_url: user?.imageUrl ?? null,
            },
            { onConflict: "clerk_user_id" }
          )
          .select("id, xp, coins")
          .single();

        if (error) throw error;

        if (!cancelled && data) {
          setProfileId(data.id);
          setXp(Number(data.xp ?? 0));
          setCoins(Number(data.coins ?? 0));
        }
      } catch (e) {
        console.error("ensureProfile error:", e);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    ensureProfile();
    return () => {
      cancelled = true;
    };
  }, [clerkUserId, supabase, user]);

  // 2) Fetch leaderboard
  const fetchLeaderboard = async () => {
    setLoadingBoard(true);
    try {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_limit: 25,
        p_offset: 0,
      });

      if (error) throw error;
      setLeaderboard((data as LeaderRow[]) ?? []);
    } catch (e) {
      console.error("fetchLeaderboard error:", e);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => {
    if (!profileId) return;
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // 3) Award XP/coins demo (call your RPC)
  const awardDemo = async () => {
    if (!profileId) return;

    const gainXp = 10;
    const gainCoins = 2;

    // optimistic
    setXp((v) => v + gainXp);
    setCoins((v) => v + gainCoins);

    try {
      const txId = Crypto.randomUUID();

      const { data, error } = await supabase.rpc("award_xp", {
        p_profile_id: profileId,
        p_client_tx_id: txId,
        p_amount_xp: gainXp,
        p_amount_coins: gainCoins,
        p_reason: "decision_completed",
        p_decision_id: null,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (row?.new_xp != null) setXp(Number(row.new_xp));
      if (row?.new_coins != null) setCoins(Number(row.new_coins));

      fetchLeaderboard();
    } catch (e) {
      console.error("award_xp error:", e);
      // revert optimistic
      setXp((v) => v - gainXp);
      setCoins((v) => v - gainCoins);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (e) {
      console.error("signOut error:", e);
    } finally {
      setSigningOut(false);
    }
  };

  const content = useMemo(() => {
    if (activeTab === "New") {
      return (
        <View style={styles.content}>
          <Text style={styles.title}>Need help making a{`\n`}decision?</Text>
          <Text style={styles.placeholderText}>
            You’ll put your chat / decision flow here.
          </Text>
        </View>
      );
    }

    if (activeTab === "History") {
      return (
        <View style={styles.content}>
          <Text style={styles.placeholderTitle}>History</Text>
          <Text style={styles.placeholderText}>Your past decisions will show here.</Text>
        </View>
      );
    }

    if (activeTab === "Profile") {
      return (
        <View style={styles.content}>
          <Text style={styles.placeholderTitle}>
            Welcome{user?.firstName ? `, ${user.firstName}` : ""} 👋
          </Text>

          <View style={{ height: 12 }} />

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
      );
    }

    // Progress tab
    return (
      <View style={styles.content}>
        <Text style={styles.placeholderTitle}>Progress</Text>

        {loadingProfile ? (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.statsCard}>
            <Text style={styles.statText}>XP: {xp}</Text>
            <Text style={styles.statText}>Coins: {coins}</Text>

            <Pressable style={styles.demoBtn} onPress={awardDemo}>
              <Text style={styles.demoBtnText}>Test: +10 XP / +2 Coins</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 18 }} />

        <View style={styles.boardHeaderRow}>
          <Text style={styles.subtitle}>Leaderboard</Text>
          <Pressable onPress={fetchLeaderboard} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={16} color={TEXT} />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {loadingBoard ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.profile_id}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item, index }) => {
              const isMe = item.clerk_user_id === clerkUserId;
              return (
                <View style={[styles.row, isMe && styles.rowMe]}>
                  <Text style={[styles.rank, isMe && styles.rankMe]}>#{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                    <Text style={styles.small}>
                      XP {item.xp} • Coins {item.coins}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    );
  }, [
    activeTab,
    clerkUserId,
    leaderboard,
    loadingBoard,
    loadingProfile,
    signingOut,
    user?.firstName,
    xp,
    coins,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header (Balance) */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Balance</Text>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>?</Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>{content}</View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TabItem label="New" icon="sparkles-outline" active={activeTab === "New"} onPress={() => setActiveTab("New")} />
        <TabItem label="History" icon="time-outline" active={activeTab === "History"} onPress={() => setActiveTab("History")} />
        <TabItem label="Progress" icon="trending-up-outline" active={activeTab === "Progress"} onPress={() => setActiveTab("Progress")} />
        <TabItem label="Profile" icon="person-outline" active={activeTab === "Profile"} onPress={() => setActiveTab("Profile")} />
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

  title: { fontSize: 26, lineHeight: 32, fontWeight: "500", color: TEXT, marginBottom: 10 },

  placeholderTitle: { fontSize: 20, fontWeight: "800", color: TEXT, marginBottom: 10 },
  placeholderText: { fontSize: 14, color: MUTED },

  statsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#A7DEDB",
    gap: 8,
  },
  statText: { fontSize: 14, color: TEXT, fontWeight: "700" },

  demoBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#0A5E62",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  demoBtnText: { color: "white", fontWeight: "800", fontSize: 12 },

  boardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, fontWeight: "800", color: TEXT },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10 },
  refreshText: { color: TEXT, fontWeight: "800", fontSize: 12 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(10,94,98,0.10)",
  },
  rowMe: {
    borderColor: "rgba(10,94,98,0.45)",
    backgroundColor: "rgba(191,237,235,0.65)",
  },
  rank: { width: 46, color: MUTED, fontWeight: "800" },
  rankMe: { color: TEXT },
  name: { color: TEXT, fontWeight: "800" },
  nameMe: { color: TEXT },
  small: { color: MUTED, fontSize: 12, marginTop: 2 },

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
