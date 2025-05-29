import { createClient } from "@supabase/supabase-js"

// Supabase client voor client-side gebruik (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase URL of Anon Key ontbreekt. Controleer je omgevingsvariabelen.")
      // Return een dummy client die geen echte operaties uitvoert maar ook geen errors gooit
      return {
        from: () => ({
          select: () => ({ data: [], error: new Error("Supabase niet geconfigureerd") }),
          insert: () => ({ data: null, error: new Error("Supabase niet geconfigureerd") }),
          delete: () => ({ error: new Error("Supabase niet geconfigureerd") }),
        }),
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        }),
      } as any
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Supabase client voor server-side gebruik
export const createServerSupabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )
}

// Type definities
export interface Product {
  id?: string
  name: string
  qrcode?: string
  created_at?: string
}

export interface RegistrationEntry {
  id?: string
  user: string
  product: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
  qrcode?: string
  created_at?: string
}

// Database functies
export async function fetchProducts() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

export async function saveProduct(product: Product) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("products").insert([product]).select()

  if (error) {
    console.error("Error saving product:", error)
    return { data: null, error }
  }

  return { data: data?.[0] || null, error: null }
}

export async function deleteProduct(id: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error("Error deleting product:", error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

export async function fetchUsers() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return { data: [], error }
  }

  return { data: data?.map((user) => user.name) || [], error: null }
}

export async function saveUser(name: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("users").insert([{ name }]).select()

  if (error) {
    console.error("Error saving user:", error)
    return { data: null, error }
  }

  return { data: data?.[0] || null, error: null }
}

export async function deleteUser(name: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("users").delete().eq("name", name)

  if (error) {
    console.error("Error deleting user:", error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

export async function fetchLocations() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching locations:", error)
    return { data: [], error }
  }

  return { data: data?.map((location) => location.name) || [], error: null }
}

export async function saveLocation(name: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("locations").insert([{ name }]).select()

  if (error) {
    console.error("Error saving location:", error)
    return { data: null, error }
  }

  return { data: data?.[0] || null, error: null }
}

export async function deleteLocation(name: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("locations").delete().eq("name", name)

  if (error) {
    console.error("Error deleting location:", error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

export async function fetchPurposes() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("purposes").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching purposes:", error)
    return { data: [], error }
  }

  return { data: data?.map((purpose) => purpose.name) || [], error: null }
}

export async function savePurpose(name: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("purposes").insert([{ name }]).select()

  if (error) {
    console.error("Error saving purpose:", error)
    return { data: null, error }
  }

  return { data: data?.[0] || null, error: null }
}

export async function deletePurpose(name: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("purposes").delete().eq("name", name)

  if (error) {
    console.error("Error deleting purpose:", error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

export async function fetchRegistrations() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching registrations:", error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

export async function saveRegistration(registration: Omit<RegistrationEntry, "id" | "created_at">) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("registrations").insert([registration]).select()

  if (error) {
    console.error("Error saving registration:", error)
    return { data: null, error }
  }

  return { data: data?.[0] || null, error: null }
}

// Realtime subscriptions
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const supabase = getSupabaseClient()

  return supabase
    .channel("products-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
      const { data } = await fetchProducts()
      if (data) callback(data)
    })
    .subscribe()
}

export function subscribeToUsers(callback: (users: string[]) => void) {
  const supabase = getSupabaseClient()

  return supabase
    .channel("users-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async () => {
      const { data } = await fetchUsers()
      if (data) callback(data)
    })
    .subscribe()
}

export function subscribeToLocations(callback: (locations: string[]) => void) {
  const supabase = getSupabaseClient()

  return supabase
    .channel("locations-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async () => {
      const { data } = await fetchLocations()
      if (data) callback(data)
    })
    .subscribe()
}

export function subscribeToPurposes(callback: (purposes: string[]) => void) {
  const supabase = getSupabaseClient()

  return supabase
    .channel("purposes-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "purposes" }, async () => {
      const { data } = await fetchPurposes()
      if (data) callback(data)
    })
    .subscribe()
}

export function subscribeToRegistrations(callback: (registrations: RegistrationEntry[]) => void) {
  const supabase = getSupabaseClient()

  return supabase
    .channel("registrations-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, async () => {
      const { data } = await fetchRegistrations()
      if (data) callback(data)
    })
    .subscribe()
}
