"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Package, MapPin, Save, History, CheckCircle, Download, UserPlus, Trash2, Target } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  saveRegistration,
  getRegistrations,
  saveUsers,
  getUsers,
  saveProducts,
  getProducts,
  saveLocations,
  getLocations,
  savePurposes,
  getPurposes,
  type RegistrationEntry,
} from "@/lib/firebase-clean"
// Standaard gegevens
const DEFAULT_USERS = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const DEFAULT_PRODUCTS = ["Laptop Dell XPS", 'Monitor Samsung 24"', "Muis Logitech", "Toetsenbord Mechanical"]
const DEFAULT_LOCATIONS = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
const DEFAULT_PURPOSES = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]

export default function ProductRegistrationApp() {
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[0])
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_PRODUCTS[0])
  const [location, setLocation] = useState(DEFAULT_LOCATIONS[0])
  const [purpose, setPurpose] = useState(DEFAULT_PURPOSES[0])
  const [entries, setEntries] = useState<RegistrationEntry[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Beheer states
  const [users, setUsers] = useState<string[]>(DEFAULT_USERS)
  const [products, setProducts] = useState<string[]>(DEFAULT_PRODUCTS)
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS)
  const [purposes, setPurposes] = useState<string[]>(DEFAULT_PURPOSES)

  // Nieuwe item states
  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")

  // Filter en zoek states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUser, setFilterUser] = useState("all")
  const [filterProduct, setFilterProduct] = useState("")
  const [filterLocation, setFilterLocation] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "user" | "product">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Laad opgeslagen gegevens
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)

    // Laad registraties
    try {
      const { data: firebaseData, error } = await getRegistrations()

      if (!error && firebaseData && firebaseData.length > 0) {
        setEntries(firebaseData)
        console.log("✅ Loaded registrations from Firebase")
      } else {
        console.log("No Firebase registrations found, using localStorage")
        const savedEntries = localStorage.getItem("productRegistrations")
        if (savedEntries) {
          setEntries(JSON.parse(savedEntries))
        }
      }
    } catch (error) {
      console.log("Firebase not available for registrations, using localStorage")
      const savedEntries = localStorage.getItem("productRegistrations")
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries))
      }
    }

    // Laad gebruikers
    try {
      const { data: usersData, error } = await getUsers()
      if (!error && usersData && usersData.length > 0) {
        setUsers(usersData)
        console.log("✅ Loaded users from Firebase")
      } else {
        console.log("No Firebase users found, using localStorage")
        const savedUsers = localStorage.getItem("customUsers")
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers))
        }
      }
    } catch (error) {
      console.log("Firebase not available for users, using localStorage")
      const savedUsers = localStorage.getItem("customUsers")
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers))
      }
    }

    // Laad producten
    try {
      const { data: productsData, error } = await getProducts()
      if (!error && productsData && productsData.length > 0) {
        setProducts(productsData)
        console.log("✅ Loaded products from Firebase")
      } else {
        console.log("No Firebase products found, using localStorage")
        const savedProducts = localStorage.getItem("customProducts")
        if (savedProducts) {
          setProducts(JSON.parse(savedProducts))
        }
      }
    } catch (error) {
      console.log("Firebase not available for products, using localStorage")
      const savedProducts = localStorage.getItem("customProducts")
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts))
      }
    }

    // Laad locaties
    try {
      const { data: locationsData, error } = await getLocations()
      if (!error && locationsData && locationsData.length > 0) {
        setLocations(locationsData)
        console.log("✅ Loaded locations from Firebase")
      } else {
        console.log("No Firebase locations found, using localStorage")
        const savedLocations = localStorage.getItem("customLocations")
        if (savedLocations) {
          setLocations(JSON.parse(savedLocations))
        }
      }
    } catch (error) {
      console.log("Firebase not available for locations, using localStorage")
      const savedLocations = localStorage.getItem("customLocations")
      if (savedLocations) {
        setLocations(JSON.parse(savedLocations))
      }
    }

    // Laad doelen
    try {
      const { data: purposesData, error } = await getPurposes()
      if (!error && purposesData && purposesData.length > 0) {
        setPurposes(purposesData)
        console.log("✅ Loaded purposes from Firebase")
      } else {
        console.log("No Firebase purposes found, using localStorage")
        const savedPurposes = localStorage.getItem("customPurposes")
        if (savedPurposes) {
          setPurposes(JSON.parse(savedPurposes))
        }
      }
    } catch (error) {
      console.log("Firebase not available for purposes, using localStorage")
      const savedPurposes = localStorage.getItem("customPurposes")
      if (savedPurposes) {
        setPurposes(JSON.parse(savedPurposes))
      }
    }

    setIsLoading(false)
  }

  // Sla gegevens op
  const saveToStorage = async (newEntry: Omit<RegistrationEntry, "id" | "created_at">) => {
    try {
      const { data: firebaseData, error } = await saveRegistration(newEntry)

      if (!error && firebaseData) {
        const updatedEntries = [firebaseData, ...entries]
        setEntries(updatedEntries)
        localStorage.setItem("productRegistrations", JSON.stringify(updatedEntries))
        console.log("✅ Registration saved to Firebase")
        return
      }
    } catch (error) {
      console.log("Firebase not available, using localStorage")
    }

    // Fallback naar localStorage
    const localEntry: RegistrationEntry = {
      ...newEntry,
      id: Date.now().toString(),
    }
    const updatedEntries = [localEntry, ...entries]
    localStorage.setItem("productRegistrations", JSON.stringify(updatedEntries))
    setEntries(updatedEntries)
  }

  // Registreer nieuw item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

    setIsLoading(true)

    const now = new Date()
    const newEntry = {
      user: currentUser,
      product: selectedProduct,
      location,
      purpose,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("nl-NL"),
      time: now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
      photo_url: "",
      qr_code: "",
    }

    await saveToStorage(newEntry)

    // Reset form
    setSelectedProduct("")
    setLocation("")
    setPurpose("")

    // Toon success bericht
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
    setIsLoading(false)
  }

  // Export naar CSV
  const exportToCSV = () => {
    const filteredEntries = getFilteredAndSortedEntries()
    const headers = ["Datum", "Tijd", "Gebruiker", "Product", "Locatie", "Doel"]
    const csvContent = [
      headers.join(","),
      ...filteredEntries.map((entry) =>
        [
          entry.date,
          entry.time,
          `"${entry.user}"`,
          `"${entry.product}"`,
          `"${entry.location}"`,
          `"${entry.purpose}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)

    const filterSuffix = searchQuery || filterUser || filterProduct || filterLocation ? "-gefilterd" : ""
    link.setAttribute("download", `product-registraties${filterSuffix}-${new Date().toISOString().split("T")[0]}.csv`)

    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Voeg nieuwe gebruiker toe
  const addNewUser = async () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const updatedUsers = [...users, newUserName.trim()]
      setUsers(updatedUsers)

      try {
        await saveUsers(updatedUsers)
        console.log("✅ Users saved to Firebase")
      } catch (error) {
        console.error("Error saving users to Firebase:", error)
      }

      localStorage.setItem("customUsers", JSON.stringify(updatedUsers))
      setNewUserName("")
    }
  }

  // Voeg nieuw product toe
  const addNewProduct = async () => {
    if (newProductName.trim() && !products.includes(newProductName.trim())) {
      const updatedProducts = [...products, newProductName.trim()]
      setProducts(updatedProducts)

      try {
        await saveProducts(updatedProducts)
        console.log("✅ Products saved to Firebase")
      } catch (error) {
        console.error("Error saving products to Firebase:", error)
      }

      localStorage.setItem("customProducts", JSON.stringify(updatedProducts))
      setNewProductName("")
    }
  }

  // Voeg nieuwe locatie toe
  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const updatedLocations = [...locations, newLocationName.trim()]
      setLocations(updatedLocations)

      try {
        await saveLocations(updatedLocations)
        console.log("✅ Locations saved to Firebase")
      } catch (error) {
        console.error("Error saving locations to Firebase:", error)
      }

      localStorage.setItem("customLocations", JSON.stringify(updatedLocations))
      setNewLocationName("")
    }
  }

  // Voeg nieuw doel toe
  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const updatedPurposes = [...purposes, newPurposeName.trim()]
      setPurposes(updatedPurposes)

      try {
        await savePurposes(updatedPurposes)
        console.log("✅ Purposes saved to Firebase")
      } catch (error) {
        console.error("Error saving purposes to Firebase:", error)
      }

      localStorage.setItem("customPurposes", JSON.stringify(updatedPurposes))
      setNewPurposeName("")
    }
  }

  // Verwijder item
  const removeUser = async (userToRemove: string) => {
    const updatedUsers = users.filter((user) => user !== userToRemove)
    setUsers(updatedUsers)

    try {
      await saveUsers(updatedUsers)
    } catch (error) {
      console.error("Error saving users to Firebase after removal:", error)
    }

    localStorage.setItem("customUsers", JSON.stringify(updatedUsers))
  }

  const removeProduct = async (productToRemove: string) => {
    const updatedProducts = products.filter((product) => product !== productToRemove)
    setProducts(updatedProducts)

    try {
      await saveProducts(updatedProducts)
    } catch (error) {
      console.error("Error saving products to Firebase after removal:", error)
    }

    localStorage.setItem("customProducts", JSON.stringify(updatedProducts))
  }

  const removeLocation = async (locationToRemove: string) => {
    const updatedLocations = locations.filter((loc) => loc !== locationToRemove)
    setLocations(updatedLocations)

    try {
      await saveLocations(updatedLocations)
    } catch (error) {
      console.error("Error saving locations to Firebase after removal:", error)
    }

    localStorage.setItem("customLocations", JSON.stringify(updatedLocations))
  }

  const removePurpose = async (purposeToRemove: string) => {
    const updatedPurposes = purposes.filter((p) => p !== purposeToRemove)
    setPurposes(updatedPurposes)

    try {
      await savePurposes(updatedPurposes)
    } catch (error) {
      console.error("Error saving purposes to Firebase after removal:", error)
    }

    localStorage.setItem("customPurposes", JSON.stringify(updatedPurposes))
  }

  // Filter en zoek functies
  const getFilteredAndSortedEntries = () => {
    const filtered = entries.filter((entry) => {
      const searchMatch =
        !searchQuery ||
        entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.purpose.toLowerCase().includes(searchQuery.toLowerCase())

      const userMatch = !filterUser || filterUser === "all" || entry.user === filterUser
      const productMatch = !filterProduct || entry.product.toLowerCase().includes(filterProduct.toLowerCase())
      const locationMatch = !filterLocation || filterLocation === "all" || entry.location === filterLocation

      let dateMatch = true
      if (filterDateFrom || filterDateTo) {
        const entryDate = new Date(entry.timestamp)
        if (filterDateFrom) {
          const fromDate = new Date(filterDateFrom)
          dateMatch = dateMatch && entryDate >= fromDate
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo + "T23:59:59")
          dateMatch = dateMatch && entryDate <= toDate
        }
      }

      return searchMatch && userMatch && productMatch && locationMatch && dateMatch
    })

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case "user":
          comparison = a.user.localeCompare(b.user)
          break
        case "product":
          comparison = a.product.localeCompare(b.product)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }

  // Wis alle filters
  const clearAllFilters = () => {
    setSearchQuery("")
    setFilterUser("all")
    setFilterProduct("")
    setFilterLocation("all")
    setFilterDateFrom("")
    setFilterDateTo("")
    setSortBy("date")
    setSortOrder("desc")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
     
