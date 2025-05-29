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

// Database functies
export const saveRegistration = async (entry: Omit<RegistrationEntry, "id" | "created_at">) => {
  // Return early if Supabase is not configured
  if (!supabase) {
    return { data: null, error: new Error("Supabase not configured") }
  }

  try {
    const { data, error } = await supabase.from("registrations").insert([entry]).select()

    if (error) throw error
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

    if (error) throw error
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
