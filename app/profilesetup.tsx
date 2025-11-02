import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { auth, db, storage } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MaterialIcons } from "@expo/vector-icons";

export default function ProfileSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [interestedIn, setInterestedIn] = useState("female");
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [preference, setPreference] = useState("long-term");
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !age || !gender || !bio) {
      Alert.alert("Error", "Name, Age, Gender, and Bio are required!");
      return;
    }
    if (Number(age) < 18) {
      Alert.alert("Error", "You must be at least 18 years old");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      let imageUrl = image;

      if (image && image.startsWith("file://")) {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "users", user.uid), {
        name,
        age: Number(age),
        gender,
        interestedIn,
        bio,
        hobbies,
        preference,
        ...(imageUrl && { image: imageUrl }),
      });

      Alert.alert("Success", "Profile saved!");
      router.push("/tabs/swipescreen");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>

      {/* Circular Image container visible even if no image */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="photo-camera" size={32} color="#e91e63" />
            <Text style={styles.uploadText}>Upload Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName} />
      <TextInput
        placeholder="Age"
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={gender} onValueChange={setGender}>
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <Text style={styles.label}>Interested In</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={interestedIn} onValueChange={setInterestedIn}>
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Everyone" value="everyone" />
        </Picker>
      </View>

      <Text style={styles.label}>Preference</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={preference} onValueChange={setPreference}>
          <Picker.Item label="Long Term" value="long-term" />
          <Picker.Item label="Short Term" value="short-term" />
          <Picker.Item label="One Night" value="one-night" />
          <Picker.Item label="Friend" value="friend" />
        </Picker>
      </View>

      <TextInput
        placeholder="Bio"
        style={[styles.input, { height: 80 }]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <TextInput
        placeholder="Hobbies (comma separated)"
        style={styles.input}
        value={hobbies}
        onChangeText={setHobbies}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, color: "#e91e63" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 12 },
  label: { fontWeight: "bold", marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, marginBottom: 12 },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#e91e63",
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 60 },
  placeholder: { justifyContent: "center", alignItems: "center" },
  uploadText: { color: "#e91e63", fontWeight: "bold", marginTop: 5, textAlign: "center" },
  button: { backgroundColor: "#e91e63", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
