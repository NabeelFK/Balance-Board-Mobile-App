import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  imageUri?: string;
};

export default function ChatScreen() {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // minimal “chat” state just to show the bubble like your mock
  const [messages, setMessages] = useState<Msg[]>([
    // start empty, or keep an example assistant prompt
    // { id: "a1", role: "assistant", text: "Tell me what decision you're making." },
  ]);

  const canSend = useMemo(() => text.trim().length > 0 || !!selectedImage, [text, selectedImage]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const send = () => {
    if (!canSend) return;

    const newMsg: Msg = {
      id: String(Date.now()),
      role: "user",
      text: text.trim() ? text.trim() : undefined,
      imageUri: selectedImage ?? undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setSelectedImage(null);

    // TODO: call your AI / decision-tree logic here and append assistant msg
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Balance</Text>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>?</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>How can we help you make a{`\n`}decision?</Text>

      {/* Camera button (center) */}
      <Pressable style={styles.cameraBtn} onPress={pickImage}>
        <Ionicons name="camera-outline" size={22} color={TEXT} />
      </Pressable>

      {/* Messages area (simple) */}
      <View style={styles.messagesArea}>
        {messages.map((m) =>
          m.role === "user" ? (
            <View key={m.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                {!!m.imageUri && <Image source={{ uri: m.imageUri }} style={styles.bubbleImage} />}
                {!!m.text && <Text style={styles.userText}>{m.text}</Text>}
              </View>
            </View>
          ) : (
            <View key={m.id} style={styles.assistantRow}>
              <View style={styles.assistantBubble}>
                <Text style={styles.assistantText}>{m.text}</Text>
              </View>
            </View>
          )
        )}
      </View>

      {/* Composer */}
      <View style={styles.composerWrap}>
        {/* thumbnail preview like Frame 6 */}
        {selectedImage && (
          <View style={styles.previewRow}>
            <Image source={{ uri: selectedImage }} style={styles.previewThumb} />
            <Pressable onPress={() => setSelectedImage(null)} style={styles.removeBtn}>
              <Ionicons name="close" size={16} color={TEXT} />
            </Pressable>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="ask anything..."
            placeholderTextColor="#7AAFB1"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
          />

          <Pressable
            onPress={send}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && { opacity: 0.35 },
              pressed && canSend && { opacity: 0.85 },
            ]}
            disabled={!canSend}
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

  title: {
    marginTop: 26,
    paddingHorizontal: 26,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "500",
    color: TEXT,
  },

  cameraBtn: {
    marginTop: 18,
    alignSelf: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#A7DEDB",
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
  },

  messagesArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  userRow: { alignItems: "flex-end" },
  userBubble: {
    maxWidth: "80%",
    backgroundColor: "#BFEDEB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  userText: { color: TEXT, fontSize: 14 },

  assistantRow: { alignItems: "flex-start" },
  assistantBubble: {
    maxWidth: "80%",
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  assistantText: { color: MUTED, fontSize: 14 },

  bubbleImage: {
    width: 160,
    height: 90,
    borderRadius: 12,
    marginBottom: 8,
  },

  composerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7DEDB",
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#A7DEDB",
    alignItems: "center",
    justifyContent: "center",
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
