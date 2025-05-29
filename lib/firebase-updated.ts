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
  onSnapshot,
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

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  barcode?: string
  created_at?: string
}

export interface User {
  id: string
  name: string
  email?: string
  role?: string
  created_at?: string
}

export interface Location {
  id: string
  name: string
  description?: string
  address?: string
  created_at?: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  target?: number
  current?: number
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

// REGISTRATIONS (bestaande functies)
export const saveRegistration = async (entry: Omit<RegistrationEntry, "id" | "created_at">) => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

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
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

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

// PRODUCTS - Nieuwe functies
export const saveProduct = async (product: Omit<Product, "id" | "created_at">) => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: null, error: new Error("Firestore not available") }
  }

  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...product,
      created_at: Timestamp.now(),
    })

    const savedProduct: Product = {
      ...product,
      id: docRef.id,
      created_at: new Date().toISOString(),
    }

    console.log("✅ Product saved to Firestore")
    return { data: savedProduct, error: null }
  } catch (error) {
    console.error("❌ Error saving product to Firestore:", error)
    return { data: null, error }
  }
}

export const getProducts = async () => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: [], error: new Error("Firestore not available") }
  }

  try {
    const q = query(collection(db, "products"), orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name,
        description: data.description || "",
        category: data.category || "",
        barcode: data.barcode || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })

    console.log(`✅ Retrieved ${products.length} products from Firestore`)
    return { data: products, error: null }
  } catch (error) {
    console.error("❌ Error fetching products from Firestore:", error)
    return { data: [], error }
  }
}

// USERS - Nieuwe functies
export const saveUser = async (user: Omit<User, "id" | "created_at">) => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: null, error: new Error("Firestore not available") }
  }

  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...user,
      created_at: Timestamp.now(),
    })

    const savedUser: User = {
      ...user,
      id: docRef.id,
      created_at: new Date().toISOString(),
    }

    console.log("✅ User saved to Firestore")
    return { data: savedUser, error: null }
  } catch (error) {
    console.error("❌ Error saving user to Firestore:", error)
    return { data: null, error }
  }
}

export const getUsers = async () => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: [], error: new Error("Firestore not available") }
  }

  try {
    const q = query(collection(db, "users"), orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    const users: User[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        name: data.name,
        email: data.email || "",
        role: data.role || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })

    console.log(`✅ Retrieved ${users.length} users from Firestore`)
    return { data: users, error: null }
  } catch (error) {
    console.error("❌ Error fetching users from Firestore:", error)
    return { data: [], error }
  }
}

// LOCATIONS - Nieuwe functies
export const saveLocation = async (location: Omit<Location, "id" | "created_at">) => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: null, error: new Error("Firestore not available") }
  }

  try {
    const docRef = await addDoc(collection(db, "locations"), {
      ...location,
      created_at: Timestamp.now(),
    })

    const savedLocation: Location = {
      ...location,
      id: docRef.id,
      created_at: new Date().toISOString(),
    }

    console.log("✅ Location saved to Firestore")
    return { data: savedLocation, error: null }
  } catch (error) {
    console.error("❌ Error saving location to Firestore:", error)
    return { data: null, error }
  }
}

export const getLocations = async () => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: [], error: new Error("Firestore not available") }
  }

  try {
    const q = query(collection(db, "locations"), orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    const locations: Location[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      locations.push({
        id: doc.id,
        name: data.name,
        description: data.description || "",
        address: data.address || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })

    console.log(`✅ Retrieved ${locations.length} locations from Firestore`)
    return { data: locations, error: null }
  } catch (error) {
    console.error("❌ Error fetching locations from Firestore:", error)
    return { data: [], error }
  }
}

// GOALS - Nieuwe functies
export const saveGoal = async (goal: Omit<Goal, "id" | "created_at">) => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: null, error: new Error("Firestore not available") }
  }

  try {
    const docRef = await addDoc(collection(db, "goals"), {
      ...goal,
      created_at: Timestamp.now(),
    })

    const savedGoal: Goal = {
      ...goal,
      id: docRef.id,
      created_at: new Date().toISOString(),
    }

    console.log("✅ Goal saved to Firestore")
    return { data: savedGoal, error: null }
  } catch (error) {
    console.error("❌ Error saving goal to Firestore:", error)
    return { data: null, error }
  }
}

export const getGoals = async () => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

  if (!db) {
    return { data: [], error: new Error("Firestore not available") }
  }

  try {
    const q = query(collection(db, "goals"), orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    const goals: Goal[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      goals.push({
        id: doc.id,
        title: data.title,
        description: data.description || "",
        target: data.target || 0,
        current: data.current || 0,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })

    console.log(`✅ Retrieved ${goals.length} goals from Firestore`)
    return { data: goals, error: null }
  } catch (error) {
    console.error("❌ Error fetching goals from Firestore:", error)
    return { data: [], error }
  }
}

// REALTIME LISTENERS voor automatische synchronisatie
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  if (!db) return () => {}

  const q = query(collection(db, "products"), orderBy("created_at", "desc"))
  return onSnapshot(q, (querySnapshot) => {
    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name,
        description: data.description || "",
        category: data.category || "",
        barcode: data.barcode || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })
    callback(products)
  })
}

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  if (!db) return () => {}

  const q = query(collection(db, "users"), orderBy("created_at", "desc"))
  return onSnapshot(q, (querySnapshot) => {
    const users: User[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        name: data.name,
        email: data.email || "",
        role: data.role || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })
    callback(users)
  })
}

export const subscribeToLocations = (callback: (locations: Location[]) => void) => {
  if (!db) return () => {}

  const q = query(collection(db, "locations"), orderBy("created_at", "desc"))
  return onSnapshot(q, (querySnapshot) => {
    const locations: Location[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      locations.push({
        id: doc.id,
        name: data.name,
        description: data.description || "",
        address: data.address || "",
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })
    callback(locations)
  })
}

export const subscribeToGoals = (callback: (goals: Goal[]) => void) => {
  if (!db) return () => {}

  const q = query(collection(db, "goals"), orderBy("created_at", "desc"))
  return onSnapshot(q, (querySnapshot) => {
    const goals: Goal[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      goals.push({
        id: doc.id,
        title: data.title,
        description: data.description || "",
        target: data.target || 0,
        current: data.current || 0,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      })
    })
    callback(goals)
  })
}

export const subscribeToRegistrations = (callback: (registrations: RegistrationEntry[]) => void) => {
  if (!db) return () => {}

  const q = query(collection(db, "registrations"), orderBy("created_at", "desc"))
  return onSnapshot(q, (querySnapshot) => {
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
    callback(registrations)
  })
}

// Bestaande functies
export const uploadPhoto = async (file: File, fileName: string) => {
  if (!isFirebaseInitialized) {
    await initializeFirebase()
  }

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

// Helper functions
export const isFirebaseConfigured = () => {
  return isFirebaseInitialized && db !== null
}

export const getFirebaseStatus = () => {
  return {
    initialized: isFirebaseInitialized,
    firestoreAvailable: db !== null,
    storageAvailable: storage !== null,
  }
}
