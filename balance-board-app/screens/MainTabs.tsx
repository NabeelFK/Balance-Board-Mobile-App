import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import NewStack from "./NewStack";
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
          paddingBottom: 8,
          paddingTop: 6,
          justifyContent: "center",
          paddingHorizontal: 20,
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 0,
          borderRadius: 16,
          elevation: 6,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
        },
        tabBarItemStyle: { paddingTop: 6 },
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
        tabBarButton: (props) => {
          const { accessibilityState, children, onPress } = props as any;
          const focused = accessibilityState?.selected;
          return (
            <Pressable
              onPress={onPress}
              style={[styles.tabButton, focused && styles.tabButtonActive]}
            >
              {children}
            </Pressable>
          );
        },
      })}
    >
      {/* ✅ IMPORTANT: Use NewStack here */}
      <Tab.Screen name="New" component={NewStack} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Progress" component={Progress} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 0,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 2,
    paddingHorizontal: 6,
  },
  tabButtonActive: {
    backgroundColor: "rgba(39,185,174,0.10)",
  },
});