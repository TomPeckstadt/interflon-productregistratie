import { createClient } from "@supabase/supabase-js"

// Voeg deze debug functie toe aan het begin van het bestand, direct na de import statement
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG ${new Date().toISOString()}] ${message}`, data || "")
}

// Supabase client voor client-side gebruik (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Supabase configuratie:", {
      url: supabaseUrl ? "Aanwezig" : "Ontbreekt",
      key: supabaseAnonKey ? "Aanwezig" : "Ontbreekt",
    })

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

    try {
      console.log("Supabase client wordt geïnitialiseerd...")
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
      console.log("Supabase client succesvol geïnitialiseerd")
    } catch (error) {
      console.error("Fout bij initialiseren Supabase client:", error)
      return {
        from: () => ({
          select: () => ({ data: [], error: new Error("Supabase initialisatie mislukt") }),
          insert: () => ({ data: null, error: new Error("Supabase initialisatie mislukt") }),
          delete: () => ({ error: new Error("Supabase initialisatie mislukt") }),
        }),
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        }),
      } as any
    }
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
// Update de Product interface om category_id en category informatie toe te voegen
export interface Product {
  id?: string
  name: string
  qrcode?: string
  category_id?: string
  created_at?: string
  // Voor joined queries
  category?: ProductCategory
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
  qrcode?: string // Aangepast naar lowercase om overeen te komen met de database
  created_at?: string
}

// Voeg deze nieuwe interface toe na de bestaande interfaces
export interface ProductCategory {
  id?: string
  name: string
  description?: string
  color?: string
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

// Voeg deze functie toe na de saveProduct functie
export async function updateProduct(id: string, product: Partial<Product>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("products").update(product).eq("id", id).select()

  if (error) {
    console.error("Error updating product:", error)
    return { data: null, error }
  }

  return { data: data?.[0] || null, error: null }
}

// Voeg deze functie toe om producten met categorie informatie op te halen
export async function fetchProductsWithCategories() {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      // If categories table doesn't exist, fall back to regular products
      if (error.message && error.message.includes('relation "public.categories" does not exist')) {
        console.warn("Categories table doesn't exist, falling back to regular products")
        return await fetchProducts()
      }
      console.error("Error fetching products with categories:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Unexpected error fetching products with categories:", error)
    // Fallback to regular products
    return await fetchProducts()
  }
}

export async function deleteProduct(id: string) {
  debugLog("deleteProduct aangeroepen met ID:", id)
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return { success: false, error }
    }

    debugLog("Product succesvol verwijderd met ID:", id)
    return { success: true, error: null }
  } catch (error) {
    console.error("Onverwachte fout bij verwijderen product:", error)
    return { success: false, error }
  }
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
  debugLog("saveUser aangeroepen met:", name)
  const supabase = getSupabaseClient()

  try {
    debugLog("Bezig met opslaan van gebruiker...")
    const { data, error } = await supabase.from("users").insert([{ name }]).select()

    if (error) {
      console.error("Database error bij opslaan gebruiker:", error)
      return { data: null, error }
    }

    debugLog("Gebruiker succesvol opgeslagen:", data)
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error("Onverwachte fout bij opslaan gebruiker:", error)
    return { data: null, error }
  }
}

export async function deleteUser(name: string) {
  console.log("deleteUser aangeroepen met:", name)
  const supabase = getSupabaseClient()

  try {
    console.log("Bezig met verwijderen van gebruiker...")
    const { error } = await supabase.from("users").delete().eq("name", name)

    if (error) {
      console.error("Database error bij verwijderen gebruiker:", error)
      return { success: false, error }
    }

    console.log("Gebruiker succesvol verwijderd")
    return { success: true, error: null }
  } catch (error) {
    console.error("Onverwachte fout bij verwijderen gebruiker:", error)
    return { success: false, error }
  }
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

export function subscribeToUsers(callback: (users: string[]) => void) {
  debugLog("Setting up users subscription")
  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async (payload) => {
        debugLog("Users change detected:", payload)
        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching updated users:", error)
          return
        }

        if (data) {
          const userNames = data.map((user) => user.name)
          debugLog("Updated users list:", userNames)
          callback(userNames)
        }
      })
      .subscribe((status) => {
        debugLog(`Users subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("Error setting up users subscription:", error)
    return {
      unsubscribe: () => {},
    }
  }
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  debugLog("Setting up products subscription")
  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async (payload) => {
        debugLog("Products change detected:", payload)
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching updated products:", error)
          return
        }

        if (data) {
          debugLog("Updated products list:", data)
          callback(data)
        }
      })
      .subscribe((status) => {
        debugLog(`Products subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("Error setting up products subscription:", error)
    return {
      unsubscribe: () => {},
    }
  }
}

export function subscribeToLocations(callback: (locations: string[]) => void) {
  debugLog("Setting up locations subscription")
  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("locations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async (payload) => {
        debugLog("Locations change detected:", payload)
        const { data, error } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching updated locations:", error)
          return
        }

        if (data) {
          const locationNames = data.map((location) => location.name)
          debugLog("Updated locations list:", locationNames)
          callback(locationNames)
        }
      })
      .subscribe((status) => {
        debugLog(`Locations subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("Error setting up locations subscription:", error)
    return {
      unsubscribe: () => {},
    }
  }
}

export function subscribeToPurposes(callback: (purposes: string[]) => void) {
  debugLog("Setting up purposes subscription")
  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("purposes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "purposes" }, async (payload) => {
        debugLog("Purposes change detected:", payload)
        const { data, error } = await supabase.from("purposes").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching updated purposes:", error)
          return
        }

        if (data) {
          const purposeNames = data.map((purpose) => purpose.name)
          debugLog("Updated purposes list:", purposeNames)
          callback(purposeNames)
        }
      })
      .subscribe((status) => {
        debugLog(`Purposes subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("Error setting up purposes subscription:", error)
    return {
      unsubscribe: () => {},
    }
  }
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

// Categorieën functies
export async function fetchCategories() {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false })

    if (error) {
      // Check if the error is because the table doesn't exist
      if (error.message && error.message.includes('relation "public.categories" does not exist')) {
        console.warn("Categories table doesn't exist yet. Please run the SQL script to create it.")
        return { data: [], error: null }
      }
      console.error("Error fetching categories:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Unexpected error fetching categories:", error)
    return { data: [], error }
  }
}

export async function saveCategory(category: Omit<ProductCategory, "id" | "created_at">) {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("categories").insert([category]).select()

    if (error) {
      if (error.message && error.message.includes('relation "public.categories" does not exist')) {
        return { data: null, error: { message: "Categories table doesn't exist. Please run the SQL script first." } }
      }
      console.error("Error saving category:", error)
      return { data: null, error }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error("Unexpected error saving category:", error)
    return { data: null, error }
  }
}

export async function updateCategory(id: string, category: Partial<ProductCategory>) {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("categories").update(category).eq("id", id).select()

    if (error) {
      if (error.message && error.message.includes('relation "public.categories" does not exist')) {
        return { data: null, error: { message: "Categories table doesn't exist. Please run the SQL script first." } }
      }
      console.error("Error updating category:", error)
      return { data: null, error }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error("Unexpected error updating category:", error)
    return { data: null, error }
  }
}

export async function deleteCategory(id: string) {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      if (error.message && error.message.includes('relation "public.categories" does not exist')) {
        return {
          success: false,
          error: { message: "Categories table doesn't exist. Please run the SQL script first." },
        }
      }
      console.error("Error deleting category:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error deleting category:", error)
    return { success: false, error }
  }
}

export function subscribeToCategories(callback: (categories: ProductCategory[]) => void) {
  debugLog("Setting up categories subscription")
  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("categories-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, async (payload) => {
        debugLog("Categories change detected:", payload)

        try {
          const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("created_at", { ascending: false })

          if (error) {
            if (error.message && error.message.includes('relation "public.categories" does not exist')) {
              console.warn("Categories table doesn't exist yet for subscription.")
              callback([])
              return
            }
            console.error("Error fetching updated categories:", error)
            return
          }

          if (data) {
            debugLog("Updated categories list:", data)
            callback(data)
          }
        } catch (error) {
          console.error("Error in categories subscription:", error)
          callback([])
        }
      })
      .subscribe((status) => {
        debugLog(`Categories subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("Error setting up categories subscription:", error)
    return {
      unsubscribe: () => {},
    }
  }
}
