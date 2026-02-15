import React, { useMemo, useRef, useState } from "react";
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

export default function ChatScreen() {
  const navigation = useNavigation<any>();

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
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
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

  const fakeAssistantReply = (userText: string) => {
    // Replace this later with real AI response or decision-tree logic
    if (userText.toLowerCase().includes("study")) {
      return (
        "Let’s structure it.\n\n1) What’s the deadline/urgency?\n2) What do you gain from the event?\n3) If you go, how much studying can you still do after?\n\nAnswer those and I’ll suggest an outcome."
      );
    }
    return "Got it. What are the top 2 options you’re choosing between?";
  };

  const send = () => {
    if (!canSend) return;

    const clean = text.trim();
    addMessage("user", clean);
    setText("");
    Keyboard.dismiss();

    // simulate assistant response
    setTimeout(() => {
      addMessage("assistant", fakeAssistantReply(clean));
      scrollToBottom();
    }, 400);

    scrollToBottom();
  };

  // Show “Choose outcome” when conversation is long enough (simple demo rule)
  const showChooseOutcome = messages.length >= 6;

  const chooseOutcome = () => {
    addMessage("assistant", "✅ Outcome chosen. I can summarize your decision + next steps.");
    scrollToBottom();
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <BalanceHeader />
      {/* Header */}
      <View style={styles.header}>
        {/* ✅ Back button */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </Pressable>

        </View>


      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardShouldPersistTaps="handled"
      />

      {/* Choose outcome button */}
      {showChooseOutcome && (
        <View style={styles.outcomeWrap}>
          <Pressable
            onPress={chooseOutcome}
            style={({ pressed }) => [styles.outcomeBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.outcomeText}>Choose outcome</Text>
          </Pressable>
          <Text style={styles.outcomeHint}>(Need more help? keep chatting)</Text>
        </View>
      )}

      {/* Composer */}
      <View style={styles.composerWrap}>
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Your response..."
            placeholderTextColor="#7AAFB1"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
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

  backBtn: {
    position: "absolute",
    left: 10,
    padding: 10,
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

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
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

  assistantBubble: {
    backgroundColor: CARD,
    borderColor: "#A7DEDB",
  },
  userBubble: {
    backgroundColor: "#BFEDEB",
    borderColor: "#9ADDD9",
  },

  bubbleText: { fontSize: 13, lineHeight: 18 },
  assistantText: { color: MUTED },
  userText: { color: TEXT, fontWeight: "500" },

  outcomeWrap: {
    paddingHorizontal: 16,
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
  outcomeText: { color: "white", fontWeight: "700" },
  outcomeHint: { fontSize: 11, color: MUTED },

  composerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7DEDB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
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