import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import NewStack from "./NewStack"; // ✅ use the stack, not NewScreen
import HistoryScreen from "./HistoryScreen";
import Progress from "./Progress";
import ProfileScreen from "./ProfileScreen";

const Tab = createBottomTabNavigator();

const BG = "#DDF5F4";
const TEXT = "#0A5E62";
const MUTED = "#4F7F81";

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: "#BFE7E5",
          borderTopWidth: 1,
          height: 74,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarActiveTintColor: TEXT,
        tabBarInactiveTintColor: MUTED,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === "New"
              ? "sparkles-outline"
              : route.name === "History"
              ? "time-outline"
              : route.name === "Progress"
              ? "trending-up-outline"
              : "person-outline";

          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      {/* ✅ IMPORTANT: New tab must use the stack */}
      <Tab.Screen name="New" component={NewStack} />

      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Progress" component={Progress} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}