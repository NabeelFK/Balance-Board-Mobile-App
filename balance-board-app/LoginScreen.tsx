import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  const sendCode = async () => {
    if (!isLoaded) return;

    await signIn.create({
      identifier: email,
    });

    const firstFactor = signIn.supportedFirstFactors?.find(
      (factor) => factor.strategy === "email_code"
    );

    if (!firstFactor) return;

    await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: firstFactor.emailAddressId,
    });

    setPending(true);
  };

  const verifyCode = async () => {
    if (!isLoaded) return;

    const res = await signIn.attemptFirstFactor({
      strategy: "email_code",
      code,
    });

    if (res.status === "complete") {
      await setActive({ session: res.createdSessionId });
    }
  };

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>Sign In</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <Button title="Send Code" onPress={sendCode} />

      {pending && (
        <>
          <TextInput
            placeholder="Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={{ borderWidth: 1, padding: 12, marginVertical: 12 }}
          />
          <Button title="Verify Code" onPress={verifyCode} />
        </>
      )}
    </View>
  );
}
