// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/firebase.js
//  Configuração Firebase + helpers Firestore
// ══════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyChUhTBDQvhqf2SL0gwhSX7Fc54ByA2umA",
  authDomain:        "superamigos-4708a.firebaseapp.com",
  projectId:         "superamigos-4708a",
  storageBucket:     "superamigos-4708a.firebasestorage.app",
  messagingSenderId: "350084352623",
  appId:             "1:350084352623:web:4e9e9a0322723a8c3a9b9a"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

export {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
};
