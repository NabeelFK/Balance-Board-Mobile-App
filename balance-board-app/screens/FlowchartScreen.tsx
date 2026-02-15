import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";
import BalanceHeader from "../components/BalanceHeader";

// ✅ adjust if your supabaseClient location differs
import { supabase } from "../lib/db/supabaseClient";
import { saveDecision } from "../lib/db/saveDecision";

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";

export default function FlowchartScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useUser();

  const { problem, sessions, answersByDecision, outcomes, queryCount } = route.params;

  const [chosenDecision, setChosenDecision] = useState<string | null>(null);

  const score = useMemo(() => {
    // base +200, each question -20, clamp at 0
    return Math.max(0, 200 - 20 * (Number(queryCount) || 0));
  }, [queryCount]);

  const [saving, setSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);

const confirm = async () => {
  if (!chosenDecision || saving) return;

  setSaving(true);
  setSaveError(null);

    try {
      const chosenOutcome = outcomes?.[chosenDecision]?.predicted_outcome ?? "";

      const payload = {
        user_id: user?.id ?? null,
        problem: problem ?? "",
        chosen_decision: chosenDecision,
        chosen_outcome: chosenOutcome,
        score: Math.max(0, 200 - 20 * (Number(queryCount) || 0)),
        query_count: Number(queryCount) || 0,
        details: { sessions, answersByDecision, outcomes },
        created_at: new Date().toISOString(),
      };

      console.log("INSERT payload:", payload);

      const data = await saveDecision(payload);

      console.log("INSERT result:", data, null);

      // go to History tab
      navigation.getParent()?.navigate("History");
    } catch (e: any) {
      console.log("CONFIRM ERROR:", e);
      setSaveError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
};

  return (
    <View style={styles.screen}>
      <BalanceHeader />

      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bigTitle}>
          <Text style={styles.bigTitleText}>Decision 1{"\n"}or{"\n"}Decision 2</Text>
        </View>

        <View style={styles.columns}>
          {sessions.map((s: any) => {
            const decision = s.decision;
            const ans = answersByDecision?.[decision] ?? { s: "", w: "", o: "", t: "" };
            const out = outcomes?.[decision];

            return (
              <View key={decision} style={styles.column}>
                <Text style={styles.columnTitle}>{decision}</Text>

                {s.questions?.map((q: any, idx: number) => {
                  const key = ["s", "w", "o", "t"][idx] as "s" | "w" | "o" | "t";
                  return (
                    <View key={q.text + idx} style={styles.card}>
                      <Text style={styles.cardTitle}>Question {idx + 1}</Text>
                      <Text style={styles.cardSub}>{q.text}</Text>
                      <Text style={styles.cardAns}>{ans[key] || "—"}</Text>
                    </View>
                  );
                })}

                <Pressable
                  onPress={() => setChosenDecision(decision)}
                  style={[
                    styles.outcomeCard,
                    chosenDecision === decision && styles.outcomeCardActive,
                  ]}
                >
                  <Text style={styles.outcomeTitle}>Outcome</Text>
                  <Text style={styles.outcomeText}>{out?.predicted_outcome || "—"}</Text>
                  <Text style={styles.outcomeMeta}>
                    Confidence: {out?.probability ?? "—"}%
                  </Text>
                  <Text style={styles.pickHint}>
                    {chosenDecision === decision ? "Selected ✅" : "Tap to select"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreTitle}>Reward</Text>
          <Text style={styles.scoreText}>Query count: {queryCount}</Text>
          <Text style={styles.scoreText}>Score: +{score}</Text>
        </View>

        <Pressable
          onPress={confirm}
          disabled={!chosenDecision}
          style={({ pressed }) => [
            styles.confirmBtn,
            !chosenDecision && { opacity: 0.4 },
            pressed && chosenDecision && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={styles.confirmText}>Confirm Outcome</Text>
        </Pressable>

        <Text style={styles.smallHint}>
          This will save your decision to History.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  topRow: { height: 38, justifyContent: "center" },
  backBtn: { position: "absolute", left: 14, padding: 8 },
  backText: { color: TEXT, fontWeight: "800", fontSize: 14 },

  scroll: { padding: 18, paddingBottom: 30 },

  bigTitle: {
    backgroundColor: TEXT,
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 14,
  },
  bigTitleText: { color: "white", fontWeight: "900", fontSize: 26, textAlign: "center" },

  columns: { flexDirection: "row", gap: 12 },
  column: { flex: 1, gap: 10 },

  columnTitle: { color: TEXT, fontWeight: "900", fontSize: 16, textAlign: "center" },

  card: {
    backgroundColor: "#4CB59E",
    borderRadius: 16,
    padding: 12,
  },
  cardTitle: { color: "white", fontWeight: "900", marginBottom: 6, textAlign: "center" },
  cardSub: { color: "white", opacity: 0.95, fontSize: 12, marginBottom: 8 },
  cardAns: { color: "white", fontWeight: "800", fontSize: 12 },

  outcomeCard: {
    backgroundColor: "#4CB59E",
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  outcomeCardActive: { borderColor: "#0B8F84" },
  outcomeTitle: { color: "white", fontWeight: "900", textAlign: "center", marginBottom: 6 },
  outcomeText: { color: "white", fontWeight: "800", fontSize: 12, marginBottom: 6 },
  outcomeMeta: { color: "white", opacity: 0.95, fontSize: 12, marginBottom: 6 },
  pickHint: { color: "white", fontWeight: "900", textAlign: "center" },

  scoreBox: {
    marginTop: 16,
    backgroundColor: "#CDEEEE",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7DEDB",
  },
  scoreTitle: { color: TEXT, fontWeight: "900", marginBottom: 6 },
  scoreText: { color: MUTED, fontWeight: "800" },

  confirmBtn: {
    marginTop: 18,
    backgroundColor: "#1BCFA6",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  confirmText: { color: "white", fontWeight: "900", fontSize: 22 },

  smallHint: { marginTop: 8, color: MUTED, textAlign: "center", fontSize: 12 },
});