import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  type Firestore,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDgiqNvaodY8BjJAmJtxeRpjv8CSlFPrzM",
  authDomain: "interflon-productregistratie.firebaseapp.com",
  projectId: "interflon-productregistratie",
  storageBucket: "interflon-productregistratie.appspot.com",
  messagingSenderId: "981473557039",
  appId: "1:981473557039:web:7dc086b074939c221164da",
}

export interface RegistrationEntry {
  id: string
  user: string
  product: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
  photo_url?: string
  qr_code?: string
  created_at?: string
}

// Firebase initialisatie state
let firebaseApp: FirebaseApp | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let isFirebaseInitialized = false

// Initialiseer Firebase alleen wanneer nodig
const initializeFirebase = async () => {
  if (isFirebaseInitialized) {
    return { success: db !== null, error: null }
  }

  try {
    // Initialiseer Firebase App
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()

    // Wacht even voordat we Firestore proberen te initialiseren
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Probeer Firestore te initialiseren
    try {
      db = getFirestore(firebaseApp)
      console.log("✅ Firestore successfully initialized")
    } catch (firestoreError) {
      console.warn("⚠️ Firestore initialization failed:", firestoreError)
      db = null
    }

    // Probeer Storage te initialiseren
    try {
      storage = getStorage(firebaseApp)
      console.log("✅ Firebase Storage successfully initialized")
    } catch (storageError) {
      console.warn("⚠️ Firebase Storage initialization failed:", storageError)
      storage = null
    }

    isFirebaseInitialized = true
    return { success: db !== null, error: null }
  } catch (error) {
    console.warn("⚠️ Firebase initialization failed:", error)
    isFirebaseInitialized = true
    return { success: false, error }
  }
}

// Database functies met lazy initialization
export const saveRegistration = async (entry: Omit<RegistrationEntry, "id" | "created_at">) => {
  // Probeer Firebase te initialiseren als dat nog niet is gebeurd
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  // Check of Firestore beschikbaar is
  if (!db) {
    console.log("📱 Using localStorage fallback for saving registration")
    return { data: null, error: new Error("Firestore not available") }
  }

  try {
    const docRef = await addDoc(collection(db, "registrations"), {
      ...entry,
      created_at: Timestamp.now(),
    })

    const savedEntry: RegistrationEntry = {
      ...entry,
      id: docRef.id,
      created_at: new Date().toISOString(),
    }

    console.log("✅ Registration saved to Firestore")
    return { data: savedEntry, error: null }
  } catch (error) {
    console.error("❌ Error saving registration to Firestore:", error)
    return { data: null, error }
  }
}

export const getRegistrations = async () => {
  // Probeer Firebase te initialiseren als dat nog niet is gebeurd
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  // Check of Firestore beschikbaar is
  if (!db) {
    console.log("📱 Using localStorage fallback for getting registrations")
    return { data: [], error: new Error("Firestore not available") }
  }

  try {
    const q = query(collection(db, "registrations"), orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    const registrations: RegistrationEntry[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      registrations.push({
        id: doc.id,
        user: data.user,
        product: data.product,
        location: data.location,
        purpose: data.purpose,
        timestamp: data.timestamp,
        date: data.date,
        time: data.time,
        photo_url: data.photo_url || "",
        qr_code: data.qr_code || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })

    console.log(`✅ Retrieved ${registrations.length} registrations from Firestore`)
    return { data: registrations, error: null }
  } catch (error) {
    console.error("❌ Error fetching registrations from Firestore:", error)
    return { data: [], error }
  }
}

export const uploadPhoto = async (file: File, fileName: string) => {
  // Probeer Firebase te initialiseren als dat nog niet is gebeurd
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  // Check of Storage beschikbaar is
  if (!storage) {
    console.log("📱 Firebase Storage not available, using local preview only")
    return { url: null, error: new Error("Firebase Storage not available") }
  }

  try {
    const storageRef = ref(storage, `registration-photos/${fileName}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    console.log("✅ Photo uploaded to Firebase Storage")
    return { url: downloadURL, error: null }
  } catch (error) {
    console.error("❌ Error uploading photo to Firebase Storage:", error)
    return { url: null, error }
  }
}

// Helper function to check if Firebase is available
export const isFirebaseConfigured = () => {
  return isFirebaseInitialized && db !== null
}

// Helper function to get Firebase status
export const getFirebaseStatus = () => {
  return {
    initialized: isFirebaseInitialized,
    firestoreAvailable: db !== null,
    storageAvailable: storage !== null,
  }
}
