import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import * as Crypto from "expo-crypto";
import { useUser } from "@clerk/clerk-expo";
import { useSupabase } from "../providers/SupabaseProvider";
import BalanceHeader from "../components/BalanceHeader";

type LeaderRow = {
  profile_id: string;
  clerk_user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  coins: number; // kept in type because RPC returns it, but we won’t display it
  created_at: string;
};

export default function Progress() {
  const supabase = useSupabase();
  const { user } = useUser();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  const clerkUserId = user?.id ?? null;

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const progress01 = useMemo(() => (xp % 100) / 100, [xp]);
  const xpIntoLevel = useMemo(() => xp % 100, [xp]);

  // Ensure profile exists
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
          .select("id, xp")
          .single();

        if (error) throw error;

        if (!cancelled && data) {
          setProfileId(data.id);
          setXp(Number(data.xp ?? 0));
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

  // Test XP award (no coins shown)
  const awardDemo = async () => {
    if (!profileId) return;

    const gainXp = 10;

    // optimistic
    setXp((v) => v + gainXp);

    try {
      const txId = Crypto.randomUUID();

      const { data, error } = await supabase.rpc("award_xp", {
        p_profile_id: profileId,
        p_client_tx_id: txId,
        p_amount_xp: gainXp,
        p_amount_coins: 0,
        p_reason: "decision_completed",
        p_decision_id: null,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (row?.new_xp != null) setXp(Number(row.new_xp));

      fetchLeaderboard();
    } catch (e) {
      console.error("award_xp error:", e);
      setXp((v) => v - gainXp);
    }
  };

  return (
    <View style={styles.screen}>
      <BalanceHeader />

      <View style={styles.content}>
        <Text style={styles.placeholderTitle}>Progress</Text>

        {loadingProfile ? (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.statsCard}>
            <View style={styles.statTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statText}>Level {level}</Text>
                <Text style={styles.statSub}>
                  XP {xpIntoLevel}/100 (Total {xp})
                </Text>
              </View>

              <Pressable style={styles.demoBtn} onPress={awardDemo}>
                <Text style={styles.demoBtnText}>Test: +10 XP</Text>
              </Pressable>
            </View>

            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${progress01 * 100}%` }]} />
            </View>
          </View>
        )}

        <View style={{ height: 18 }} />

        <View style={styles.boardHeaderRow}>
          <Text style={styles.subtitle}>Leaderboard</Text>
          <Pressable onPress={fetchLeaderboard} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {loadingBoard ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.profile_id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item, index }) => {
              const isMe = item.clerk_user_id === clerkUserId;
              const initial = (item.display_name?.[0] || "U").toUpperCase();

              return (
                <View style={[styles.row, isMe && styles.rowMe]}>
                  <Text style={[styles.rank, isMe && styles.rankMe]}>#{index + 1}</Text>

                  <View style={styles.avatarWrap}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                      <Text style={styles.avatarFallback}>{initial}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                    <Text style={styles.small}>XP {item.xp}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";
const CARD = "#CDEEEE";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { flex: 1, paddingHorizontal: 26, paddingTop: 18 },

  placeholderTitle: { fontSize: 20, fontWeight: "800", color: TEXT, marginBottom: 10 },

  statsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#A7DEDB",
    gap: 10,
  },

  statTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statText: { fontSize: 16, color: TEXT, fontWeight: "900" },
  statSub: { fontSize: 12, color: MUTED, marginTop: 2 },

  progressOuter: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(10,94,98,0.10)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10,94,98,0.12)",
  },
  progressInner: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: TEXT,
  },

  demoBtn: {
    backgroundColor: TEXT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  demoBtnText: { color: "white", fontWeight: "900", fontSize: 12 },

  boardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, fontWeight: "900", color: TEXT },
  refreshBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  refreshText: { color: TEXT, fontWeight: "900", fontSize: 12 },

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

  rank: { width: 38, color: MUTED, fontWeight: "900" },
  rankMe: { color: TEXT },

  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(10,94,98,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10,94,98,0.18)",
  },
  avatar: { width: 36, height: 36 },
  avatarFallback: { color: TEXT, fontWeight: "900" },

  name: { color: TEXT, fontWeight: "900" },
  nameMe: { color: TEXT },
  small: { color: MUTED, fontSize: 12, marginTop: 2 },
});
