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
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const isEmailValid = useMemo(() => {
    // simple, good-enough email check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  }, [normalizedEmail]);

  const canSend = isLoaded && !isSending && isEmailValid;
  const canVerify = isLoaded && !isVerifying && code.trim().length >= 6;

  const sendCode = async () => {
    if (!canSend) return;
    setError(null);
    setIsSending(true);

    try {
      await signIn!.create({ identifier: normalizedEmail });

      const firstFactor = signIn!.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!firstFactor || !("emailAddressId" in firstFactor)) {
        throw new Error("Email code sign-in is not available for this account.");
      }

      await signIn!.prepareFirstFactor({
        strategy: "email_code",
        // @ts-ignore - clerk types vary slightly across versions; runtime supports this
        emailAddressId: firstFactor.emailAddressId,
      });

      setPending(true);
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.message ||
        e?.message ||
        "Something went wrong sending the code. Try again.";
      setError(msg);
      setPending(false);
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    if (!canVerify) return;
    setError(null);
    setIsVerifying(true);

    try {
      const res = await signIn!.attemptFirstFactor({
        strategy: "email_code",
        code: code.trim(),
      });

      if (res.status === "complete") {
        await setActive!({ session: res.createdSessionId });
      } else {
        setError("That code didn’t work. Double-check it and try again.");
      }
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.message ||
        e?.message ||
        "Invalid code. Try again.";
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const resetEmail = () => {
    setPending(false);
    setCode("");
    setError(null);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <View style={styles.card}>
          <Text style={styles.brand}>Balance Board</Text>
          <Text style={styles.title}>
            {pending ? "Enter your code" : "Sign in"}
          </Text>
          <Text style={styles.subtitle}>
            {pending
              ? `We sent a 6-digit code to ${normalizedEmail}`
              : "Use your email to get a one-time sign-in code."}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!pending ? (
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
                returnKeyType="done"
                onSubmitEditing={sendCode}
              />

              <Pressable
                onPress={sendCode}
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
                  <Text style={styles.buttonText}>Send code</Text>
                )}
              </Pressable>

              <Text style={styles.hint}>
                Tip: check spam/junk if it doesn’t show up.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                placeholder="123456"
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={verifyCode}
                autoFocus
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
                {isVerifying ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.buttonText}>Verify & continue</Text>
                )}
              </Pressable>

              <View style={styles.row}>
                <Pressable onPress={sendCode} disabled={isSending}>
                  <Text style={styles.link}>Resend code</Text>
                </Pressable>

                <Text style={styles.dot}>•</Text>

                <Pressable onPress={resetEmail}>
                  <Text style={styles.link}>Change email</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: "#0b1220",
    justifyContent: "center" as const,
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
    fontWeight: "700" as const,
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
    alignItems: "center" as const,
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
    fontWeight: "700" as const,
    fontSize: 16,
  },
  hint: {
    marginTop: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  row: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginTop: 12,
    gap: 8,
  },
  link: {
    color: "#9bb6ff",
    fontWeight: "600" as const,
  },
  dot: {
    color: "rgba(255,255,255,0.35)",
  },
};
