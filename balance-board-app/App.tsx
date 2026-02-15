import React, { useState } from "react";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import { SupabaseProvider } from "./providers/SupabaseProvider";
import Progress from "./screens/Progress";

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

export default function App() {
  const [authScreen, setAuthScreen] = useState<"login" | "signup">("login");

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >

    <SignedIn>
      <SupabaseProvider>
        <Progress />
      </SupabaseProvider>
    </SignedIn>


      <SignedOut>
        {authScreen === "login" ? (
          <LoginScreen onGoToSignup={() => setAuthScreen("signup")} />
        ) : (
          <SignupScreen onGoToLogin={() => setAuthScreen("login")} />
        )}
      </SignedOut>
    </ClerkProvider>
  );
}