import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDgiqNvaodY8BjJAmJtxeRpjv8CSlFPrzM",
  authDomain: "interflon-productregistratie.firebaseapp.com",
  projectId: "interflon-productregistratie",
  storageBucket: "interflon-productregistratie.appspot.com",
  messagingSenderId: "981473557039",
  appId: "1:981473557039:web:7dc086b074939c221164da",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

console.log("🔥 Firebase initialized successfully!")
