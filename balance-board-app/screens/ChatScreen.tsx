import React, { useMemo, useRef, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { startChat, getResults } from "../lib/actions";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BalanceHeader from "../components/BalanceHeader";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  text: string;
  createdAt: number;
};

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";
const CARD = "#CDEEEE";

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [footerH, setFooterH] = useState(0);

  // Decision engine state
  const [userId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [problem, setProblem] = useState("");

  // answers stored per decision label (so flowchart can show both sides)
  const [answersByDecision, setAnswersByDecision] = useState<
    Record<string, { s: string; w: string; o: string; t: string }>
  >({});

  const [currentAnswers, setCurrentAnswers] = useState({
    s: "",
    w: "",
    o: "",
    t: "",
  });

  // outcomes stored per decision label
  const [outcomesByDecision, setOutcomesByDecision] = useState<
    Record<string, { predicted_outcome: string; probability?: number | null }>
  >({});

  // scoring
  const [queryCount, setQueryCount] = useState(0);

  // chat UI
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m1",
      role: "assistant",
      text:
        "Hi! Tell me what decision you’re trying to make.\n\nExample: “Should I study tonight or go to an event?”",
      createdAt: Date.now(),
    },
  ]);

  const listRef = useRef<FlatList<Msg>>(null);
  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const addMessage = (role: Role, msgText: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()) + Math.random(),
        role,
        text: msgText,
        createdAt: Date.now(),
      },
    ]);
  };

  const send = async () => {
    if (!canSend) return;

    const clean = text.trim();
    addMessage("user", clean);
    setText("");
    Keyboard.dismiss();

    // PHASE 1: Initialization (user describes the problem)
    if (sessions.length === 0) {
      const res = await startChat(userId, clean);

      if (res?.type === "SUCCESS" && res.sessions?.length > 0) {
        setSessions(res.sessions);
        setProblem(res.problem || clean);

        // initialize per-decision answers store
        const initial: Record<
          string,
          { s: string; w: string; o: string; t: string }
        > = {};
        res.sessions.forEach((s: any) => {
          initial[s.decision] = { s: "", w: "", o: "", t: "" };
        });
        setAnswersByDecision(initial);

        addMessage("assistant", res.sessions[0].questions[0].text);
      } else {
        addMessage("assistant", res?.message || "I couldn't process that.");
      }

      scrollToBottom();
      return;
    }

    // PHASE 2: Question loop — count these as “queries spent deciding”
    setQueryCount((c) => c + 1);

    const keys = ["s", "w", "o", "t"] as const;
    const currentKey = keys[currentStep];

    const nextAnswers = { ...currentAnswers, [currentKey]: clean };
    setCurrentAnswers(nextAnswers);

    const decisionLabel = sessions[currentTrack]?.decision;

    // also keep a copy per decision for flowchart
    if (decisionLabel) {
      setAnswersByDecision((prev) => ({
        ...prev,
        [decisionLabel]: nextAnswers,
      }));
    }

    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      const nextQ = sessions[currentTrack]?.questions?.[nextStep]?.text;
      if (nextQ) addMessage("assistant", nextQ);
    } else {
      addMessage(
        "assistant",
        `Analysis for "${sessions[currentTrack]?.decision}" complete. Tap '🔮 Generate Outcome' below.`
      );
    }

    scrollToBottom();
  };

  const showGenerateOutcome =
    sessions.length > 0 &&
    currentStep === 3 &&
    currentAnswers.t.trim().length > 0;

  const chooseOutcome = async () => {
    const session = sessions[currentTrack];
    if (!session) return;

    const sim = await getResults(userId, problem, session.decision, currentAnswers);

    const outcomeText = `Prediction for ${session.decision}:\n\n${sim.predicted_outcome}\n\nConfidence: ${sim.probability}%`;

    addMessage("assistant", outcomeText);

    // store outcome for flowchart
    setOutcomesByDecision((prev) => ({
      ...prev,
      [session.decision]: {
        predicted_outcome: sim.predicted_outcome,
        probability: sim.probability ?? null,
      },
    }));

    // go next track or finish
    if (currentTrack < sessions.length - 1) {
      const nextTrack = currentTrack + 1;

      setCurrentTrack(nextTrack);
      setCurrentStep(0);
      setCurrentAnswers({ s: "", w: "", o: "", t: "" });

      setTimeout(() => {
        const firstQ = sessions[nextTrack]?.questions?.[0]?.text;
        addMessage(
          "assistant",
          `Now let's analyze your next option: "${sessions[nextTrack].decision}"\n\n${firstQ}`
        );
        scrollToBottom();
      }, 700);
    } else {
      addMessage("assistant", "All decision tracks complete. I hope this helped!");

      // ✅ Navigate to flowchart after final outcome is shown
      setTimeout(() => {
        navigation.navigate("Flowchart", {
          problem,
          sessions,
          answersByDecision,
          outcomes: {
            ...outcomesByDecision,
            [session.decision]: {
              predicted_outcome: sim.predicted_outcome,
              probability: sim.probability ?? null,
            },
          },
          queryCount,
        });
      }, 600);
    }

    scrollToBottom();
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * FIXES IMPLEMENTED:
   * 1) Footer padding no longer adds insets.bottom (tabBarHeight already includes it on iOS)
   * 2) KeyboardAvoidingView offset includes a buffer for your custom header/back row so input lands above keyboard cleanly
   */

  const keyboardOffsetIOS = -75;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? keyboardOffsetIOS : 0}
    >
      <BalanceHeader />

      {/* Back button row */}
      <View style={styles.backRow}>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("NewHome");
          }}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          // Keep last message visible above footer + tab bar
          { paddingBottom: footerH + tabBarHeight + 16 },
        ]}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardShouldPersistTaps="handled"
      />

      {/* Footer pinned visually above tab bar by default */}
      <View
        style={[
          styles.footer,
          // IMPORTANT: do NOT add insets.bottom here; tabBarHeight already accounts for it.
          { paddingBottom: tabBarHeight + 12 },
        ]}
        onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
      >
        {showGenerateOutcome && (
          <View style={styles.outcomeWrap}>
            <Pressable onPress={chooseOutcome} style={styles.outcomeBtn}>
              <Text style={styles.outcomeText}>🔮 Generate Outcome</Text>
            </Pressable>
            <Text style={styles.outcomeHint}>
              Ready for the simulation of "{sessions[currentTrack]?.decision}"?
            </Text>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Your response..."
            placeholderTextColor="#7AAFB1"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={send}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && { opacity: 0.35 },
              pressed && canSend && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="send" size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  backRow: {
    height: 38,
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: 12,
    padding: 10,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  row: { width: "100%", flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },

  assistantBubble: { backgroundColor: CARD, borderColor: "#A7DEDB" },
  userBubble: { backgroundColor: "#BFEDEB", borderColor: "#9ADDD9" },

  bubbleText: { fontSize: 13, lineHeight: 18 },
  assistantText: { color: MUTED },
  userText: { color: TEXT, fontWeight: "500" },

  outcomeWrap: {
    paddingBottom: 6,
    alignItems: "center",
    gap: 6,
  },
  outcomeBtn: {
    backgroundColor: TEXT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  outcomeText: { color: "white", fontWeight: "800" },
  outcomeHint: { fontSize: 11, color: MUTED, textAlign: "center" },

  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#A7DEDB",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  input: { flex: 1, fontSize: 14, color: TEXT },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
});