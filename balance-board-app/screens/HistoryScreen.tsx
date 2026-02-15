import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import BalanceHeader from "../components/BalanceHeader";
import { useUser } from "@clerk/clerk-expo";
import { useIsFocused } from "@react-navigation/native";

// ✅ adjust if your supabaseClient location differs
import { supabase } from "../lib/db/supabaseClient";

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";

type Row = {
  id: number | string;
  user_id: string | null;
  problem: string;
  chosen_decision: string;
  chosen_outcome: string;
  score: number;
  query_count: number;
  created_at: string;
};

export default function HistoryScreen() {
  const { user } = useUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const isFocused = useIsFocused();

  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("decision_history")
      .select("id,user_id,problem,chosen_decision,chosen_outcome,score,query_count,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("History read error:", error);
      setRows([]);
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  return (
    <View style={styles.screen}>
      <BalanceHeader />
      <View style={styles.content}>
        <Text style={styles.title}>History</Text>
        {loading ? (
          <Text style={styles.sub}>Loading…</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.sub}>No saved decisions yet.</Text>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingTop: 10, gap: 10, paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            indicatorStyle="black"
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.chosen_decision}</Text>
                <Text style={styles.cardProblem}>{item.problem}</Text>
                <Text style={styles.cardOutcome}>{item.chosen_outcome}</Text>
                <Text style={styles.meta}>
                  Score: +{item.score} • Queries: {item.query_count}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { flex: 1, paddingHorizontal: 26, paddingTop: 22 },
  title: { fontSize: 22, fontWeight: "800", color: TEXT, marginBottom: 10 },
  sub: { fontSize: 14, color: MUTED },

  card: {
    backgroundColor: "#CDEEEE",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7DEDB",
  },
  cardTitle: { color: TEXT, fontWeight: "900", marginBottom: 6 },
  cardProblem: { color: MUTED, fontSize: 12, marginBottom: 8 },
  cardOutcome: { color: TEXT, fontWeight: "800", fontSize: 12, marginBottom: 8 },
  meta: { color: MUTED, fontSize: 11, fontWeight: "700" },
});