// app/tabs/profileview.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "expo-router";

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  interestedIn?: string;
  bio: string;
  hobbies?: string;
  image?: string;
  preference?: string;
}

interface ProfileViewProps {
  userId: string;
}

const { width } = Dimensions.get("window");

export default function ProfileView({ userId }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProfile(docSnap.data() as UserProfile);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleEdit = () => router.push(`/profilesetup?userId=${userId}`);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await auth.signOut();
            router.replace("/login");
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#e91e63" />;

  if (!profile)
    return (
      <View style={styles.center}>
        <Text>User profile not found.</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      <View style={styles.imageWrapper}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{profile.name.charAt(0)}</Text>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>
        <Text style={styles.gender}>{profile.gender}</Text>

        {profile.bio && (
          <>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.text}>{profile.bio}</Text>
          </>
        )}

        {profile.hobbies && (
          <>
            <Text style={styles.sectionTitle}>Hobbies</Text>
            <Text style={styles.text}>{profile.hobbies}</Text>
          </>
        )}

        {profile.interestedIn && (
          <>
            <Text style={styles.sectionTitle}>Interested In</Text>
            <Text style={styles.text}>{profile.interestedIn}</Text>
          </>
        )}

        {profile.preference && (
          <>
            <Text style={styles.sectionTitle}>Preference</Text>
            <Text style={styles.text}>{profile.preference}</Text>
          </>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonEdit} onPress={handleEdit}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
    backgroundColor: "#ffffffff",
    alignItems: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageWrapper: {
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: "#e91e63",
    overflow: "hidden",
  },
  profileImage: { width: 180, height: 180 },
  placeholder: {
    width: 180,
    height: 180,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { fontSize: 72, color: "#e91e63", fontWeight: "bold" },
  card: {
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  name: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  gender: { fontSize: 16, color: "#666", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  text: { fontSize: 16, color: "#333", lineHeight: 22 },
  buttonContainer: {
    width: width * 0.9,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonEdit: {
    flex: 1,
    backgroundColor: "#e91e63",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },
  buttonLogout: {
    flex: 1,
    backgroundColor: "#ff5252",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginLeft: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
