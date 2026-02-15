import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useSignUp } from "@clerk/clerk-expo";

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  }, [normalizedEmail]);

  const canSend = isLoaded && !isSending && isEmailValid && password.length >= 6;

  const signInWithPassword = async () => {
    if (!canSend) return;

    setError(null);
    setIsSending(true);

    try {
      const res = await signIn!.create({
        identifier: normalizedEmail,
        password,
      });

      if (res.status === "complete") {
        await setActive!({ session: res.createdSessionId });
      } else {
        setError("Sign in incomplete. Please try again.");
      }
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.message ||
        e?.message ||
        "Invalid email or password.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <View style={styles.card}>
          <Text style={styles.brand}>Balance Board</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Use your email and password to sign in.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={signInWithPassword}
            />

            <Pressable
              onPress={signInWithPassword}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.button,
                !canSend && styles.buttonDisabled,
                pressed && canSend && styles.buttonPressed,
              ]}
            >
              {isSending ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b1220",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#121a2a",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  brand: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  error: {
    color: "#ff7b7b",
    marginBottom: 12,
    lineHeight: 18,
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    fontSize: 13,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    color: "white",
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4c7dff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  hint: {
    marginTop: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    // If "gap" errors on your RN version, remove it and use margins instead.
    gap: 8,
  },
  link: {
    color: "#9bb6ff",
    fontWeight: "600",
  },
  dot: {
    color: "rgba(255,255,255,0.35)",
  },
});

