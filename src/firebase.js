// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDb-WufbV3Eou20z8XVYb4Ezu5bb564K0g",
  authDomain: "juvochat.firebaseapp.com",
  projectId: "juvochat",
  storageBucket: "juvochat.appspot.com", // I've corrected this for you - it's typically .appspot.com
  messagingSenderId: "487457665212",
  appId: "1:487457665212:web:1125923c1122950fffa0b9",
  measurementId: "G-LR25HDYSN8" // This is optional but good to keep
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export the Firebase services your app needs
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

