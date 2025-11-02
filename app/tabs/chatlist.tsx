// app/tabs/ChatList.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db, auth } from "../../firebase";
import { collection, doc, getDocs, getDoc, query, orderBy, limit } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { deleteDoc } from "firebase/firestore";

interface UserProfile {
  id: string;
  name: string;
  age: number;
  image?: string;
}

interface Match {
  id: string;
  users: string[];
  timestamp: number;
}

interface ChatPreview extends UserProfile {
  lastMessage?: string;
  lastTimestamp?: string;
  lastTimestampNumber?: number;
  unread?: boolean;
}

interface ChatListProps {
  navigation: any;
}

export default function ChatList({ navigation }: ChatListProps) {
  const [matches, setMatches] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const matchesSnap = await getDocs(collection(db, "matches"));
        const matchedUsers: ChatPreview[] = [];

        for (const docSnap of matchesSnap.docs) {
          const matchData = docSnap.data() as Match;
          if (!matchData.users.includes(currentUser.uid)) continue;

          const otherUserId = matchData.users.find(uid => uid !== currentUser.uid);
          if (!otherUserId) continue;

          const otherUserSnap = await getDoc(doc(db, "users", otherUserId));
          if (!otherUserSnap.exists()) continue;

          const userProfile: ChatPreview = {
            ...(otherUserSnap.data() as Omit<
              ChatPreview,
              "id" | "lastMessage" | "lastTimestamp" | "lastTimestampNumber" | "unread"
            >),
            id: otherUserSnap.id,
          };

          // Get latest message preview
          const chatId = [currentUser.uid, otherUserId].sort().join("_");
          const messagesRef = collection(db, "chats", chatId, "messages");
          const messagesSnap = await getDocs(
            query(messagesRef, orderBy("timestamp", "desc"), limit(1))
          );

          if (!messagesSnap.empty) {
            const msgData = messagesSnap.docs[0].data();
            const timestampNumber =
              msgData.timestamp instanceof Date
                ? msgData.timestamp.getTime()
                : msgData.timestamp;

            userProfile.lastMessage =
              msgData.senderId === currentUser.uid
                ? `You: ${msgData.text}`
                : msgData.text;
            userProfile.lastTimestampNumber = timestampNumber;
            userProfile.lastTimestamp = new Date(timestampNumber).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            userProfile.unread = msgData.senderId !== currentUser.uid && !msgData.seen;
          } else {
            userProfile.lastMessage = "Start chatting!";
            userProfile.lastTimestampNumber = 0;
          }

          matchedUsers.push(userProfile);
        }

        matchedUsers.sort((a, b) => (b.lastTimestampNumber || 0) - (a.lastTimestampNumber || 0));
        setMatches(matchedUsers);
      } catch (err: any) {
        console.error("Error fetching matches:", err);
        Alert.alert("Error", "Cannot load chat list. Check Firestore permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleUnmatch = (userId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  Alert.alert(
    "Unmatch User",
    "Are you sure you want to unmatch this person? This will delete your chat history.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unmatch",
        style: "destructive",
        onPress: async () => {
          try {
            const matchId = [currentUser.uid, userId].sort().join("_");
            const matchRef = doc(db, "matches", matchId);
            await deleteDoc(matchRef); // <-- correct way

            setMatches(prev => prev.filter(u => u.id !== userId));
            Alert.alert("Unmatched", "This user has been removed from your chat list.");
          } catch (err) {
            console.error("Error unmatching user:", err);
            Alert.alert("Error", "Unable to unmatch user.");
          }
        },
      },
    ]
  );
};

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  if (!matches.length) {
    return (
      <View style={styles.noMatchesContainer}>
        <Text style={styles.noMatchesText}>No matches yet 😢</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ChatPreview }) => (
    <View style={styles.chatCard}>
      {/* Unmatch button top-right */}
      <TouchableOpacity
        style={styles.unmatchButtonTop}
        onPress={() => handleUnmatch(item.id)}
      >
        <Ionicons name="close-circle" size={28} color="#ff4d6d" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cardContent}
        onPress={() =>
          navigation.navigate("ChatRoom", {
            userId: item.id,
            name: item.name,
            image: item.image,
          })
        }
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: item.image || "https://via.placeholder.com/100" }}
            style={[styles.avatar, item.unread && styles.avatarGlow]}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            {item.unread && <Text style={styles.newBadge}>NEW</Text>}
          </View>
          <Text
            numberOfLines={1}
            style={[styles.lastMessage, item.unread && styles.unreadText]}
          >
            {item.lastMessage}
          </Text>
        </View>
        {item.lastTimestamp && (
          <Text style={styles.timestamp}>{item.lastTimestamp}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf2f8", paddingTop: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  noMatchesContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noMatchesText: { fontSize: 18, color: "#777", textAlign: "center" },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
  },

  unmatchButtonTop: {
    position: "absolute",
    top: -4,
    right: -4,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  cardContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarWrapper: { width: 65, height: 65, borderRadius: 35, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarGlow: { borderWidth: 2, borderColor: "#e91e63" },
  info: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "bold", color: "#222" },
  lastMessage: { fontSize: 14, color: "#888", marginTop: 2 },
  unreadText: { color: "#000", fontWeight: "500" },
  timestamp: { fontSize: 12, color: "#999", marginLeft: 8 },
  newBadge: {
    backgroundColor: "#e91e63",
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
});
