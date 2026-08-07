import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBbPBjteAv5F_-WjYi12IxCRBlLFM_Omgg",
  authDomain: "glitos-12175.firebaseapp.com",
  projectId: "glitos-12175",
  storageBucket: "glitos-12175.firebasestorage.app",
  messagingSenderId: "741780356739",
  appId: "1:741780356739:web:4230923e63bf75c038a5b6",
  measurementId: "G-H3RT26VQZX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (Only in browser environment)
let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics blocked or failed to initialize:", e);
  }
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, googleProvider };
