import React from "react";
import { View, Text, Button } from "react-native";
import { useClerk } from "@clerk/clerk-expo";

export default function HomeScreen() {
  const { signOut } = useClerk();

  return (
    <View>
      <Text>Welcome 👋</Text>
      <Button title="Sign Out" onPress={() => signOut()} />
    </View>
  );
}
