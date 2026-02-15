import React, { useMemo, useState, useEffect } from "react";
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

type Props = { onGoToLogin: () => void };

function splitDisplayName(displayName: string) {
  const cleaned = displayName.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(" ").filter(Boolean);

  // Clerk likes firstName/lastName. If they enter 1 word, put it in firstName.
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return { cleaned, firstName, lastName };
}

export default function SignupScreen({ onGoToLogin }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const generatedUsername = useMemo(() => {
    const name = displayName.trim();
    if (name.length >= 2) return name.toLowerCase().replace(/\s+/g, "_");
    return normalizedEmail.split("@")[0];
  }, [displayName, normalizedEmail]);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  }, [normalizedEmail]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isStrongPassword = useMemo(() => {
    // 8+ chars, at least 1 letter + 1 number
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  }, [password]);

  const isDisplayNameValid = displayName.trim().length >= 2;

  const canSignUp =
    isLoaded &&
    !isSigningUp &&
    isEmailValid &&
    isDisplayNameValid &&
    isStrongPassword &&
    passwordsMatch &&
    !needsVerification;

  const canVerify =
    isLoaded && !isSigningUp && needsVerification && code.trim().length >= 4;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const signUpWithPassword = async () => {
    if (!canSignUp || !signUp || !setActive) return;

    setError(null);
    setIsSigningUp(true);

    try {
      const { cleaned, firstName, lastName } = splitDisplayName(displayName);

      // 1) Create the account in Clerk
      const res = await signUp.create({
        emailAddress: normalizedEmail,
        password,
        username: generatedUsername,

        // IMPORTANT: save display name now so it exists immediately
        unsafeMetadata: {
          display_name: cleaned,
        },
      });

      // 2) Set real Clerk name fields (prevents fallback to email in Clerk UI and in your app)
      //    Note: this is on the SignUp object during the signup flow.
      await signUp.update({
        firstName,           // <-- real Clerk field
        lastName,            // <-- real Clerk field
        unsafeMetadata: {
          display_name: cleaned, // keep it too (handy for DB upsert)
        },
      });

      // 3) If not complete, require email verification
      if (res.status !== "complete") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setNeedsVerification(true);
        setError(null);
        setResendCooldown(60);
        return;
      }

      // 4) Complete: sign in right away
      await setActive({ session: res.createdSessionId });
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.message || e?.message || "Sign up failed. Try again.";
      setError(msg);
    } finally {
      setIsSigningUp(false);
    }
  };

  const resendVerificationLink = async () => {
    if (!isLoaded || !signUp) return;
    if (resendCooldown > 0) return;

    setError(null);
    setIsSigningUp(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(60);
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message || e?.message || "Resend failed.";
      setError(msg);
    } finally {
      setIsSigningUp(false);
    }
  };

  const verifyCode = async () => {
    if (!canVerify || !signUp || !setActive) return;

    setError(null);
    setIsSigningUp(true);

    try {
      const res = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
      } else {
        setError("Verification not complete yet. Try again.");
      }
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.message || e?.message || "Invalid code. Try again.";
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
            placeholder="Display Name"
            placeholderTextColor={COLORS.tealPlaceholder}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
            editable={!needsVerification}
          />
          {!isDisplayNameValid && displayName.length > 0 ? (
            <Text style={styles.error}>
              Display name must be at least 2 characters.
            </Text>
          ) : null}

          {needsVerification ? (
            <>
              <TextInput
                placeholder="Email verification code"
                placeholderTextColor={COLORS.tealPlaceholder}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                style={styles.input}
                onSubmitEditing={verifyCode}
              />

              <Pressable
                onPress={verifyCode}
                disabled={!canVerify}
                style={({ pressed }) => [
                  styles.button,
                  !canVerify && styles.buttonDisabled,
                  pressed && canVerify && styles.buttonPressed,
                ]}
              >
                {isSigningUp ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </Pressable>

              <Pressable
                onPress={resendVerificationLink}
                disabled={resendCooldown > 0 || isSigningUp}
                style={({ pressed }) => [
                  styles.smallButton,
                  (resendCooldown > 0 || isSigningUp) &&
                    styles.smallButtonDisabled,
                  pressed && resendCooldown === 0 && styles.smallButtonPressed,
                ]}
              >
                {isSigningUp ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.smallButtonText}>
                    {resendCooldown > 0
                      ? `Resend code (${resendCooldown}s)`
                      : "Resend code"}
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
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
              {!isStrongPassword && password.length > 0 ? (
                <Text style={styles.error}>
                  Password must be 8+ chars and include a letter + number.
                </Text>
              ) : null}

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
            </>
          )}

          <Pressable onPress={() => onGoToLogin()} style={styles.linkWrap}>
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
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignSelf: "center",
    marginTop: 8,
  },
  smallButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.995 }],
  },
  smallButtonDisabled: {
    opacity: 0.5,
  },
  smallButtonText: {
    color: COLORS.teal,
    fontSize: 16,
    fontWeight: "700",
  },
});
