// app/Matches.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

interface Match {
  id: string;
  users: string[];
  timestamp: number;
}

interface UserProfile {
  id: string;
  name: string;
  image?: string;
}

export default function Matches({ navigation }: any) {
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const q = query(collection(db, "matches"), where("users", "array-contains", currentUser.uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const fetchedUsers: UserProfile[] = [];

        for (const docSnap of snapshot.docs) {
          const matchData = docSnap.data() as Match;
          if (!matchData.users.includes(currentUser.uid)) continue;

          const otherUserId = matchData.users.find((uid) => uid !== currentUser.uid);
          if (!otherUserId) continue;

          const userDoc = await getDoc(doc(db, "users", otherUserId));
          if (userDoc.exists()) {
            fetchedUsers.push({ id: userDoc.id, ...userDoc.data() } as UserProfile);
          }
        }

        setMatches(fetchedUsers);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error fetching matches:", err);
      setLoading(false);
    }
  };

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const renderItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => navigation.navigate("ChatRoom", { userId: item.id, name: item.name })}
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/100" }}
        style={styles.avatar}
      />
      <Text style={styles.matchText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#e91e63" style={{ flex: 1 }} />;

  if (!matches.length) return <Text style={styles.noMatches}>No matches yet 😢</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf2f8" },
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12, borderWidth: 2, borderColor: "#e91e63" },
  matchText: { fontSize: 18, fontWeight: "bold", color: "#222" },
  noMatches: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#555" },
});
