import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Image,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";

type Props = {
  onGoToLogin: () => void;
};

export default function SignupScreen({ onGoToLogin }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  }, [normalizedEmail]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const canSignUp =
    isLoaded &&
    !isSigningUp &&
    isEmailValid &&
    password.length >= 6 &&
    passwordsMatch;

  const signUpWithPassword = async () => {
    if (!canSignUp) return;

    setError(null);
    setIsSigningUp(true);

    try {
      const res = await signUp!.create({
        emailAddress: normalizedEmail,
        password,
      });

      if (res.status === "complete") {
        await setActive!({ session: res.createdSessionId });
      } else {
        setError(
          "Account created, but sign up is not complete. Email verification may be required."
        );
      }
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.message || e?.message || "Sign up failed. Try again.";
      setError(msg);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <View style={styles.container} pointerEvents="box-none">
        <Image
  source={require("../assets/balance_board.png")}
  style={styles.logo}
  resizeMode="contain"
/>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.tealPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
          />

          <TextInput
            placeholder="Set Password"
            placeholderTextColor={COLORS.tealPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            style={styles.input}
          />

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.tealPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            onSubmitEditing={signUpWithPassword}
          />

          {!passwordsMatch && confirmPassword.length > 0 ? (
            <Text style={styles.error}>Passwords do not match.</Text>
          ) : null}

          <Pressable
            onPress={signUpWithPassword}
            disabled={!canSignUp}
            style={({ pressed }) => [
              styles.button,
              !canSignUp && styles.buttonDisabled,
              pressed && canSignUp && styles.buttonPressed,
            ]}
          >
            {isSigningUp ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign up</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              console.log("Back to login pressed");
              onGoToLogin();
            }}
            style={styles.linkWrap}
          >
            <Text style={styles.link}>Back to log in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const COLORS = {
  bg: "#DDF6F3",
  teal: "#27B9AE",
  tealPlaceholder: "#5FCFC5",
  tealBorder: "#5FCFC5",
  dark: "#2E2E2E",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  container: {
    alignItems: "center",
    width: "100%",
  },
  header: {
    width: "100%",
    marginBottom: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { alignItems: "center" },
  titleBalance: {
    fontSize: 56,
    fontWeight: "900",
    color: COLORS.dark,
    lineHeight: 58,
  },
  titleBoard: {
    fontSize: 56,
    fontWeight: "300",
    color: COLORS.teal,
    lineHeight: 58,
    marginTop: -8,
  },
  bubble: {
    position: "absolute",
    right: 10,
    top: 12,
    width: 78,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleText: {
    color: "white",
    fontSize: 44,
    fontWeight: "900",
  },
  error: {
    color: "#b00020",
    marginBottom: 10,
    textAlign: "center",
    width: "100%",
  },
  input: {
    width: "100%",
    borderWidth: 2,
    borderColor: COLORS.tealBorder,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 26,
    color: COLORS.teal,
    marginBottom: 18,
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 999,
    marginTop: 6,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignSelf: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 28,
  },
  linkWrap: {
    marginTop: 18,
    paddingVertical: 10,
  },
  link: {
    color: COLORS.teal,
    fontSize: 18,
    textDecorationLine: "underline",
  },
  logo: {
    width: 320,
    height: 160,
    marginBottom: 28,
  },
});