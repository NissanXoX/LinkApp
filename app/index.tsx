import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// Splash cover image
import coverImage from "../assets/images/cover.png";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          router.replace("/login");
        } else {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            router.replace("/profilesetup");
          } else {
            // ✅ Route to the bottom tab layout (your app/_layout.tsx)
            router.replace("/tabs/profileview");
          }
        }
      });

      setLoading(false);
      return unsubscribe;
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={coverImage} style={styles.image} resizeMode="cover" />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { flex: 1, width: "100%", height: "100%" },
  loader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
