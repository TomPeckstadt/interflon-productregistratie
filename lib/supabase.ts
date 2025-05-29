import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if both URL and key are available
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

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

// Database setup functie
export const ensureTableExists = async () => {
  if (!supabase) return { success: false, error: "Supabase not configured" }

  try {
    // Probeer eerst een simpele query om te testen of de tabel bestaat
    const { error: testError } = await supabase.from("registrations").select("id").limit(1)

    if (testError && testError.message.includes("does not exist")) {
      // Tabel bestaat niet, maak deze aan
      const { error: createError } = await supabase.rpc("create_registrations_table")

      if (createError) {
        console.log("Could not create table automatically. Please create it manually.")
        return { success: false, error: createError }
      }

      return { success: true, error: null }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error ensuring table exists:", error)
    return { success: false, error }
  }
}

// Database functies
export const saveRegistration = async (entry: Omit<RegistrationEntry, "id" | "created_at">) => {
  // Return early if Supabase is not configured
  if (!supabase) {
    return { data: null, error: new Error("Supabase not configured") }
  }

  try {
    const { data, error } = await supabase.from("registrations").insert([entry]).select()

    if (error) {
      // Als de tabel niet bestaat, return error zodat localStorage wordt gebruikt
      if (error.message.includes("does not exist")) {
        console.log("Registrations table does not exist yet. Using localStorage fallback.")
        return { data: null, error: new Error("Table not found") }
      }
      throw error
    }
    return { data: data[0], error: null }
  } catch (error) {
    console.error("Error saving registration:", error)
    return { data: null, error }
  }
}

export const getRegistrations = async () => {
  // Return early if Supabase is not configured
  if (!supabase) {
    return { data: [], error: new Error("Supabase not configured") }
  }

  try {
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

    if (error) {
      // Als de tabel niet bestaat, return lege array in plaats van error
      if (error.message.includes("does not exist")) {
        console.log("Registrations table does not exist yet. Using localStorage fallback.")
        return { data: [], error: new Error("Table not found") }
      }
      throw error
    }
    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return { data: [], error }
  }
}

export const uploadPhoto = async (file: File, fileName: string) => {
  // Return early if Supabase is not configured
  if (!supabase) {
    return { url: null, error: new Error("Supabase not configured") }
  }

  try {
    const { data, error } = await supabase.storage.from("registration-photos").upload(fileName, file)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from("registration-photos").getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading photo:", error)
    return { url: null, error }
  }
}

// Helper function to check if Supabase is available
export const isSupabaseConfigured = () => {
  return supabase !== null
}
