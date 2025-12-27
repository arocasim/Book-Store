import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9XsTBYaMr6Mhjn4IOvgiXvvVlnShngiY",
  authDomain: "bookstore-9cfa8.firebaseapp.com",
  projectId: "bookstore-9cfa8",
  storageBucket: "bookstore-9cfa8.firebasestorage.app",
  messagingSenderId: "701045426714",
  appId: "1:701045426714:web:b8e8df79b6f45ce20a1fa3",
  measurementId: "G-BGL8147D2G",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
