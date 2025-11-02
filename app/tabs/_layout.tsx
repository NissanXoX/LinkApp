import React, { useState } from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../../firebase";

// Screens
import SwipeScreen from "./swipescreen";
import ChatList from "./chatlist";
import ProfileView from "./profileview";

const Tab = createBottomTabNavigator();

// Define type for tab keys
type TabRouteName = "Swipe" | "Chat" | "Profile";

export default function AppLayout() {
  const currentUserId = auth.currentUser?.uid;

  // Keys to force re-render for refresh
  const [refreshKeys, setRefreshKeys] = useState<Record<TabRouteName, number>>({
    Swipe: 0,
    Chat: 0,
    Profile: 0,
  });

  // Refresh handler
  const handleRefresh = (routeName: TabRouteName) => {
    setRefreshKeys((prev) => ({
      ...prev,
      [routeName]: prev[routeName] + 1,
    }));
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: string = "home";
          if (route.name === "Swipe") iconName = "favorite";
          else if (route.name === "Chat") iconName = "chat";
          else if (route.name === "Profile") iconName = "person";
          return <MaterialIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#e91e63",
        tabBarInactiveTintColor: "gray",
      })}
    >
      {/* Swipe Tab */}
      <Tab.Screen
        name="Swipe"
        children={(props) => <SwipeScreen key={refreshKeys.Swipe} {...props} />}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              handleRefresh("Swipe");
              e.preventDefault();
            }
          },
        })}
      />

      {/* Chat Tab */}
      <Tab.Screen
        name="Chat"
        children={(props) => <ChatList key={refreshKeys.Chat} {...props} />}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              handleRefresh("Chat");
              e.preventDefault();
            }
          },
        })}
      />

      {/* Profile Tab */}
      {currentUserId ? (
        <Tab.Screen
          name="Profile"
          children={(props) => (
            <ProfileView key={refreshKeys.Profile} userId={currentUserId} {...props} />
          )}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (navigation.isFocused()) {
                handleRefresh("Profile");
                e.preventDefault();
              }
            },
          })}
        />
      ) : (
        <Tab.Screen
          name="Profile"
          children={() => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text>Please log in to view your profile.</Text>
            </View>
          )}
        />
      )}
    </Tab.Navigator>
  );
}
