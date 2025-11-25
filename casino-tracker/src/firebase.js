import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCztessMai2S0oKOjheTjhwOUb2EdBB5wI",

  authDomain: "rei-do-casino.firebaseapp.com",

  projectId: "rei-do-casino",

  storageBucket: "rei-do-casino.firebasestorage.app",

  messagingSenderId: "997412256496",

  appId: "1:997412256496:web:c669180dc396865d392035",

  measurementId: "G-7YG77TPG76",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
