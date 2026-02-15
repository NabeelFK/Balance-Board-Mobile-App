import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NewScreen from "./NewScreen";
import ChatScreen from "./ChatScreen";
import FlowchartScreen from "./FlowchartScreen";

export type NewStackParamList = {
  NewHome: undefined;
  Chat: undefined;
  Flowchart: {
    problem: string;
    sessions: any[];
    answersByDecision: Record<string, { s: string; w: string; o: string; t: string }>;
    outcomes: Record<string, { predicted_outcome: string; probability?: number | null }>;
    queryCount: number;
  };
};

const Stack = createNativeStackNavigator<NewStackParamList>();

export default function NewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewHome" component={NewScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Flowchart" component={FlowchartScreen} />
    </Stack.Navigator>
  );
}