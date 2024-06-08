import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-a9f45.firebaseapp.com",
  projectId: "reactchat-a9f45",
  storageBucket: "reactchat-a9f45.appspot.com",
  messagingSenderId: "911092273258",
  appId: "1:911092273258:web:3b0e864ed86fa702a27a13",
  measurementId: "G-MEXZ8S4VSY",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);
