import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp, onSnapshot } from "firebase/firestore"

// Firebase configuratie
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

// Type definities
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

// REGISTRATIONS
export const saveRegistration = async (entry: Omit<RegistrationEntry, "id" | "created_at">) => {
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

// USERS
export const saveUsers = async (users: string[]) => {
  try {
    const docRef = await addDoc(collection(db, "settings"), {
      type: "users",
      data: users,
      updated_at: Timestamp.now(),
    })
    console.log("✅ Users saved to Firestore")
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error("❌ Error saving users to Firestore:", error)
    return { success: false, error }
  }
}

export const getUsers = async () => {
  try {
    const q = query(collection(db, "settings"), orderBy("updated_at", "desc"))
    const querySnapshot = await getDocs(q)

    let users: string[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.type === "users") {
        users = data.data || []
        return
      }
    })

    console.log(`✅ Retrieved ${users.length} users from Firestore`)
    return { data: users, error: null }
  } catch (error) {
    console.error("❌ Error fetching users from Firestore:", error)
    return { data: [], error }
  }
}

// PRODUCTS
export const saveProducts = async (products: string[]) => {
  try {
    const docRef = await addDoc(collection(db, "settings"), {
      type: "products",
      data: products,
      updated_at: Timestamp.now(),
    })
    console.log("✅ Products saved to Firestore")
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error("❌ Error saving products to Firestore:", error)
    return { success: false, error }
  }
}

export const getProducts = async () => {
  try {
    const q = query(collection(db, "settings"), orderBy("updated_at", "desc"))
    const querySnapshot = await getDocs(q)

    let products: string[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.type === "products") {
        products = data.data || []
        return
      }
    })

    console.log(`✅ Retrieved ${products.length} products from Firestore`)
    return { data: products, error: null }
  } catch (error) {
    console.error("❌ Error fetching products from Firestore:", error)
    return { data: [], error }
  }
}

// LOCATIONS
export const saveLocations = async (locations: string[]) => {
  try {
    const docRef = await addDoc(collection(db, "settings"), {
      type: "locations",
      data: locations,
      updated_at: Timestamp.now(),
    })
    console.log("✅ Locations saved to Firestore")
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error("❌ Error saving locations to Firestore:", error)
    return { success: false, error }
  }
}

export const getLocations = async () => {
  try {
    const q = query(collection(db, "settings"), orderBy("updated_at", "desc"))
    const querySnapshot = await getDocs(q)

    let locations: string[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.type === "locations") {
        locations = data.data || []
        return
      }
    })

    console.log(`✅ Retrieved ${locations.length} locations from Firestore`)
    return { data: locations, error: null }
  } catch (error) {
    console.error("❌ Error fetching locations from Firestore:", error)
    return { data: [], error }
  }
}

// PURPOSES
export const savePurposes = async (purposes: string[]) => {
  try {
    const docRef = await addDoc(collection(db, "settings"), {
      type: "purposes",
      data: purposes,
      updated_at: Timestamp.now(),
    })
    console.log("✅ Purposes saved to Firestore")
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error("❌ Error saving purposes to Firestore:", error)
    return { success: false, error }
  }
}

export const getPurposes = async () => {
  try {
    const q = query(collection(db, "settings"), orderBy("updated_at", "desc"))
    const querySnapshot = await getDocs(q)

    let purposes: string[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.type === "purposes") {
        purposes = data.data || []
        return
      }
    })

    console.log(`✅ Retrieved ${purposes.length} purposes from Firestore`)
    return { data: purposes, error: null }
  } catch (error) {
    console.error("❌ Error fetching purposes from Firestore:", error)
    return { data: [], error }
  }
}

// REALTIME LISTENERS
export const subscribeToSettings = (
  type: "users" | "products" | "locations" | "purposes",
  callback: (data: string[]) => void,
) => {
  if (!db) return () => {}

  const q = query(collection(db, "settings"), orderBy("updated_at", "desc"))
  return onSnapshot(q, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.type === type) {
        callback(data.data || [])
        return
      }
    })
  })
}
