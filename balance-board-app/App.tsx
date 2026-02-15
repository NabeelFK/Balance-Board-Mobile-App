import React, { useState } from "react";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import { SupabaseProvider } from "./providers/SupabaseProvider";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainTabs from "./screens/MainTabs";

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
        <SafeAreaProvider>
          <SupabaseProvider>
            <NavigationContainer>
              <MainTabs />
            </NavigationContainer>
          </SupabaseProvider>
        </SafeAreaProvider>
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
