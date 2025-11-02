import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  image?: string;
  bio?: string;
  hobbies?: string;
}

export default function ChatRoom() {
  // Normalize parameters to string
  const params = useLocalSearchParams();
  const userIdParam = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const nameParam = Array.isArray(params.name) ? params.name[0] : params.name;

  if (!userIdParam) return null; // stop if undefined

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const matchId = [auth.currentUser?.uid, userIdParam].sort().join("_");
    const messagesRef = collection(db, "chats", matchId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    // Fetch user profile
    const fetchUserProfile = async () => {
      const docSnap = await getDoc(doc(db, "users", userIdParam));
      if (docSnap.exists()) setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    };
    fetchUserProfile();

    return () => unsub();
  }, [userIdParam]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const matchId = [auth.currentUser?.uid, userIdParam].sort().join("_");
    await addDoc(collection(db, "chats", matchId, "messages"), {
      senderId: auth.currentUser?.uid,
      text: message,
      timestamp: Date.now(),
    });
    setMessage("");
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.senderId === auth.currentUser?.uid;
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            source={{ uri: userProfile?.image || "https://via.placeholder.com/100" }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>{nameParam}</Text>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          style={styles.input}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* User Profile Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Image
              source={{ uri: userProfile?.image || "https://via.placeholder.com/150" }}
              style={styles.modalAvatar}
            />
            <Text style={styles.modalName}>{userProfile?.name}</Text>
            {userProfile?.age && <Text style={styles.modalText}>Age: {userProfile.age}</Text>}
            {userProfile?.gender && <Text style={styles.modalText}>Gender: {userProfile.gender}</Text>}
            {userProfile?.bio && <Text style={styles.modalBio}>{userProfile.bio}</Text>}
            {userProfile?.hobbies && <Text style={styles.modalText}>Hobbies: {userProfile.hobbies}</Text>}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf2f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, borderWidth: 2, borderColor: "#e91e63" },
  headerText: { fontSize: 20, fontWeight: "bold", color: "#222" },
  messagesList: { flex: 1, paddingHorizontal: 10 },
  messageContainer: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#e91e63" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  messageText: { fontSize: 16 },
  myMessageText: { color: "white" },
  theirMessageText: { color: "#333" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#e91e63",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12, borderWidth: 2, borderColor: "#e91e63" },
  modalName: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  modalText: { fontSize: 16, color: "#555" },
  modalBio: { fontSize: 14, color: "#888", marginTop: 8, textAlign: "center" },
});
