import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator, Alert } from "react-native";
import Swiper from "react-native-deck-swiper";
import { auth, db } from "../../firebase";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";

interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  interestedIn: string;
  bio: string;
  hobbies?: string;
  image?: string;
}

interface ScoredUser extends UserProfile {
  score: number;
}

// Simple scoring
const calculateMatchScore = (user: UserProfile, currentUser: UserProfile): number => {
  let score = 0;
  score += Math.max(0, 10 - Math.abs(user.age - currentUser.age));
  score += user.gender === currentUser.interestedIn ? 20 : 0;
  score += user.interestedIn === currentUser.gender ? 20 : 0;
  return score;
};

export default function SwipeScreen() {
  const [users, setUsers] = useState<ScoredUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "User not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Get current user profile
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (!userSnap.exists()) {
          Alert.alert("Error", "Profile not found!");
          setLoading(false);
          return;
        }

        const currentProfile: UserProfile = { ...userSnap.data(), id: userSnap.id } as UserProfile;
        setCurrentUserData(currentProfile);

        // Fetch likes and matches to filter out
        const likesSnap = await getDocs(collection(db, "likes"));
        const likedUserIds: string[] = [];
        likesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.from === currentUser.uid) likedUserIds.push(data.to);
        });

        const matchesSnap = await getDocs(collection(db, "matches"));
        const matchedUserIds: string[] = [];
        matchesSnap.forEach((docSnap) => {
          const matchData = docSnap.data();
          if (matchData.users.includes(currentUser.uid)) {
            matchedUserIds.push(...matchData.users.filter((id: string) => id !== currentUser.uid));
          }
        });

        // Fetch all users except self and already liked/matched
        const userDocs = await getDocs(collection(db, "users"));
        const allUsers: UserProfile[] = [];
        userDocs.forEach((docSnap) => {
          if (docSnap.id === currentUser.uid) return;
          const profile: UserProfile = { ...docSnap.data(), id: docSnap.id } as UserProfile;
          if (
            profile.gender === currentProfile.interestedIn &&
            !likedUserIds.includes(profile.id) &&
            !matchedUserIds.includes(profile.id)
          ) {
            allUsers.push(profile);
          }
        });

        // Score users
        const scoredUsers: ScoredUser[] = allUsers
          .map((u) => ({ ...u, score: calculateMatchScore(u, currentProfile) }))
          .sort((a, b) => b.score - a.score);

        setUsers(scoredUsers);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        Alert.alert("Error", "Cannot load users. Check Firestore rules and authentication.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSwipeRight = async (index: number) => {
    if (!currentUserData) return;
    const likedUser = users[index];
    if (!likedUser) return;

    try {
      const likeId = `${currentUserData.id}_${likedUser.id}`;
      await setDoc(doc(db, "likes", likeId), {
        from: currentUserData.id,
        to: likedUser.id,
        timestamp: Date.now(),
      });

      // Check for mutual like
      const mutualSnap = await getDoc(doc(db, "likes", `${likedUser.id}_${currentUserData.id}`));
      if (mutualSnap.exists()) {
        const matchId = [currentUserData.id, likedUser.id].sort().join("_");
        await setDoc(doc(db, "matches", matchId), {
          users: [currentUserData.id, likedUser.id],
          timestamp: Date.now(),
        });
        Alert.alert("💞 It's a Match!", `You and ${likedUser.name} liked each other!`);
      }
    } catch (err: any) {
      console.error("Error liking user:", err);
      Alert.alert("Error", "Cannot like user. Check Firestore rules and authentication.");
    }
  };

  const handleSwipeLeft = (_index: number) => {
    // Optional: can record pass/dislike logic
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );

  if (users.length === 0)
    return (
      <View style={styles.noUsersContainer}>
        <Text style={styles.noUsersText}>No more users nearby 😢</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Swiper
        ref={swiperRef}
        cards={users}
        renderCard={(user: ScoredUser) => (
          <View style={styles.card}>
            <Image source={{ uri: user.image || "https://via.placeholder.com/300" }} style={styles.image} />
            <View style={styles.gradientOverlay} />
            <View style={styles.info}>
              <Text style={styles.name}>{user.name}, {user.age}</Text>
              <Text style={styles.bio}>{user.bio}</Text>
              {user.hobbies && <Text style={styles.hobbies}>🎯 {user.hobbies}</Text>}
              <Text style={styles.score}>💗 Compatibility: {user.score}%</Text>
            </View>
          </View>
        )}
        onSwipedRight={handleSwipeRight}
        onSwipedLeft={handleSwipeLeft}
        cardIndex={0}
        backgroundColor="transparent"
        stackSize={3}
        stackSeparation={15}
        verticalSwipe={false}
        overlayLabels={{
          left: {
            title: "NOPE",
            style: {
              label: {
                backgroundColor: "rgba(255, 0, 0, 0.8)",
                color: "white",
                fontSize: 32,
                borderRadius: 10,
                padding: 10,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                marginTop: 30,
                marginLeft: -20,
              },
            },
          },
          right: {
            title: "LIKE",
            style: {
              label: {
                backgroundColor: "rgba(0, 200, 0, 0.8)",
                color: "white",
                fontSize: 32,
                borderRadius: 10,
                padding: 10,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                marginTop: 30,
                marginLeft: 20,
              },
            },
          },
        }}
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff5f7",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  noUsersContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noUsersText: { fontSize: 18, color: "#777", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    height: height * 0.65,
    width: width * 0.9,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "70%",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  info: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  name: { fontSize: 22, fontWeight: "bold", color: "#222" },
  bio: { fontSize: 14, color: "#555", marginTop: 6 },
  hobbies: { fontSize: 13, color: "#888", marginTop: 4 },
  score: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#e91e63",
  },
});
