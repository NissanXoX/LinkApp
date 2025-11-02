import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZ5V4dNwe556hje4cDHfdMRzxthnFrcjU",
  authDomain: "link-dating-app-cbd90.firebaseapp.com",
  projectId: "link-dating-app-cbd90",
  storageBucket: "link-dating-app-cbd90.firebasestorage.app",
  messagingSenderId: "265309260675",
  appId: "1:265309260675:web:f1a75397c64fed0da904b6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth, Firestore, Storage
const auth = getAuth(app);  // memory persistence by default
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
