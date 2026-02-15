import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NewScreen from "./NewScreen";
import ChatScreen from "./ChatScreen";

export type NewStackParamList = {
  NewHome: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<NewStackParamList>();

export default function NewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewHome" component={NewScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}