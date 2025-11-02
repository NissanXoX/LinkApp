// app/Chat.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, Button, StyleSheet, KeyboardAvoidingView } from "react-native";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function Chat({ route }: any) {
  const { matchId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const q = query(
          collection(db, "chats"),
          where("matchId", "==", matchId),
          orderBy("timestamp", "asc")
        );

        const querySnapshot = await getDocs(q);
        const fetched: Message[] = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(fetched);
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      }
    };

    fetchMessages();
  }, [matchId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "chats"), {
        matchId,
        text: newMessage,
        senderId: auth.currentUser?.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.senderId === auth.currentUser?.uid ? styles.myMessage : styles.theirMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.input}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "70%",
  },
  myMessage: { backgroundColor: "#e91e63", alignSelf: "flex-end" },
  theirMessage: { backgroundColor: "#eee", alignSelf: "flex-start" },
  messageText: { color: "#000" },
  inputContainer: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderTopColor: "#ddd" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 8, marginRight: 8 },
});
