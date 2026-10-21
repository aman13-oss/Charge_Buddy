
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// ChargeBuddy Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmZrijD394UCYQPGS-_lNWw_H6RmvuAWI ",
  authDomain: "chargebuddy-2af9a.firebaseapp.com",
  projectId: "chargebuddy-2af9a",
  storageBucket: "chargebuddy-2af9a.firebasestorage.app",
  messagingSenderId: "805837816784",
  appId: "1:805837816784:web:316d228c737b7fc3662fd5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

console.log("ChargeBuddy Firebase initialized successfully!");

export { app, auth, googleProvider };
