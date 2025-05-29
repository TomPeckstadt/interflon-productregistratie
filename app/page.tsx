"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  fetchProducts,
  saveProduct,
  deleteProduct,
  fetchUsers,
  saveUser,
  deleteUser,
  fetchLocations,
  saveLocation,
  deleteLocation,
  fetchPurposes,
  savePurpose,
  deletePurpose,
  fetchRegistrations,
  saveRegistration,
  subscribeToProducts,
  subscribeToUsers,
  subscribeToLocations,
  subscribeToPurposes,
  subscribeToRegistrations,
  type Product,
  type RegistrationEntry,
} from "@/lib/supabase"

export default function ProductRegistrationApp() {
  const [currentUser, setCurrentUser] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
  const [entries, setEntries] = useState<RegistrationEntry[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Beheer states
  const [users, setUsers] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])

  // Nieuwe item states
  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newProductQrCode, setNewProductQrCode] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState("")
  const [qrScanMode, setQrScanMode] = useState<"registration" | "product-management">("registration")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Import states
  const [importMessage, setImportMessage] = useState("")
  const [importError, setImportError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")
  const userFileInputRef = useRef<HTMLInputElement>(null)
  const productFileInputRef = useRef<HTMLInputElement>(null)
  const locationFileInputRef = useRef<HTMLInputElement>(null)
  const purposeFileInputRef = useRef<HTMLInputElement>(null)

  // Filter en zoek states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUser, setFilterUser] = useState("all")
  const [filterProduct, setFilterProduct] = useState("")
  const [filterLocation, setFilterLocation] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "user" | "product">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Laad alle data bij start
  useEffect(() => {
    loadAllData()
    setupRealtimeSubscriptions()
  }, [])

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  // Voeg een betere foutafhandeling toe aan de loadAllData functie:

  const loadAllData = async () => {
    try {
      setConnectionStatus("connecting")

      // Controleer eerst of de omgevingsvariabelen beschikbaar zijn
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Supabase omgevingsvariabelen ontbreken")
        setConnectionStatus("error")
        setImportError("❌ Fout bij verbinden met database: Configuratie ontbreekt")
        return
      }

      // Laad alle data parallel
      const [usersResult, productsResult, locationsResult, purposesResult, registrationsResult] = await Promise.all([
        fetchUsers(),
        fetchProducts(),
        fetchLocations(),
        fetchPurposes(),
        fetchRegistrations(),
      ])

      if (usersResult.data) {
        setUsers(usersResult.data)
        if (usersResult.data.length > 0 && !currentUser) {
          setCurrentUser(usersResult.data[0])
        }
      }

      if (productsResult.data) setProducts(productsResult.data)
      if (locationsResult.data) setLocations(locationsResult.data)
      if (purposesResult.data) setPurposes(purposesResult.data)
      if (registrationsResult.data) setEntries(registrationsResult.data)

      setConnectionStatus("connected")
      setImportMessage("✅ Verbonden met database - alle data gesynchroniseerd!")
      setTimeout(() => setImportMessage(""), 3000)
    } catch (error) {
      console.error("Error loading data:", error)
      setConnectionStatus("error")
      setImportError(`❌ Fout bij verbinden met database: ${error instanceof Error ? error.message : "Onbekende fout"}`)
    }
  }

  // Wijzig de setupRealtimeSubscriptions functie om betere foutafhandeling toe te voegen
  const setupRealtimeSubscriptions = () => {
    console.log("Setting up realtime subscriptions...")

    try {
      // Setup realtime subscriptions voor automatische sync
      const unsubscribeProducts = subscribeToProducts((updatedProducts) => {
        console.log("Products subscription update received:", updatedProducts.length)
        setProducts(updatedProducts)
      })

      const unsubscribeUsers = subscribeToUsers((updatedUsers) => {
        console.log("Users subscription update received:", updatedUsers.length)
        setUsers(updatedUsers)
      })

      const unsubscribeLocations = subscribeToLocations((updatedLocations) => {
        console.log("Locations subscription update received:", updatedLocations.length)
        setLocations(updatedLocations)
      })

      const unsubscribePurposes = subscribeToPurposes((updatedPurposes) => {
        console.log("Purposes subscription update received:", updatedPurposes.length)
        setPurposes(updatedPurposes)
      })

      const unsubscribeRegistrations = subscribeToRegistrations((updatedRegistrations) => {
        console.log("Registrations subscription update received:", updatedRegistrations.length)
        setEntries(updatedRegistrations)
      })

      console.log("All realtime subscriptions set up successfully")

      // Cleanup functie
      return () => {
        console.log("Cleaning up subscriptions...")
        if (unsubscribeProducts) unsubscribeProducts.unsubscribe()
        if (unsubscribeUsers) unsubscribeUsers.unsubscribe()
        if (unsubscribeLocations) unsubscribeLocations.unsubscribe()
        if (unsubscribePurposes) unsubscribePurposes.unsubscribe()
        if (unsubscribeRegistrations) unsubscribeRegistrations.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up realtime subscriptions:", error)
      setImportError("Fout bij het opzetten van realtime updates. Vernieuw de pagina om het opnieuw te proberen.")
      return () => {}
    }
  }

  // QR Scanner functies
  const startQrScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setCameraStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setShowQrScanner(true)

      setTimeout(() => {
        scanQrCode()
      }, 1000)
    } catch (error) {
      console.error("Camera toegang geweigerd:", error)
      setImportError("Camera toegang is vereist voor QR code scanning")
    }
  }

  const stopQrScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setShowQrScanner(false)
  }

  const scanQrCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const qrInput = prompt("Scan QR code of voer QR code handmatig in:")

    if (qrInput) {
      handleQrCodeDetected(qrInput)
    } else if (showQrScanner) {
      setTimeout(scanQrCode, 1000)
    }
  }

  const handleQrCodeDetected = (qrCode: string) => {
    setQrScanResult(qrCode)

    if (qrScanMode === "registration") {
      const foundProduct = products.find((p) => p.qrcode === qrCode)

      if (foundProduct) {
        setSelectedProduct(foundProduct.name)
        setImportMessage(`✅ Product gevonden: ${foundProduct.name}`)
        setTimeout(() => setImportMessage(""), 3000)
      } else {
        setImportError(`❌ Geen product gevonden voor QR code: ${qrCode}`)
        setTimeout(() => setImportError(""), 3000)
      }
    } else if (qrScanMode === "product-management") {
      setNewProductQrCode(qrCode)
      setImportMessage(`✅ QR code gescand: ${qrCode}`)
      setTimeout(() => setImportMessage(""), 3000)
    }

    stopQrScanner()
  }

  // Excel import functie
  const handleFileImport = async (file: File, type: "users" | "products" | "locations" | "purposes") => {
    try {
      setImportError("")
      setImportMessage("Bestand wordt verwerkt...")

      const text = await file.text()
      let items: string[] = []

      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((line) => line.trim())

        if (type === "products") {
          const newProducts: Product[] = []
          lines.forEach((line) => {
            const [name, qrcode] = line.split(",").map((item) => item.replace(/"/g, "").trim())
            if (name && qrcode) {
              newProducts.push({ name, qrcode })
            }
          })

          if (newProducts.length > 0) {
            for (const product of newProducts) {
              await saveProduct(product)
            }
            setImportMessage(`✅ ${newProducts.length} nieuwe producten geïmporteerd!`)
            setTimeout(() => setImportMessage(""), 5000)
          }
          return
        } else {
          items = lines
            .map((line) => line.split(",")[0].replace(/"/g, "").trim())
            .filter((item) => item && item.length > 0)
        }
      } else {
        items = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && line.length > 0)
      }

      if (items.length === 0) {
        setImportError("Geen geldige items gevonden in het bestand")
        return
      }

      // Save items to database
      let savedCount = 0
      for (const item of items) {
        try {
          switch (type) {
            case "users":
              if (!users.includes(item)) {
                await saveUser(item)
                savedCount++
              }
              break
            case "locations":
              if (!locations.includes(item)) {
                await saveLocation(item)
                savedCount++
              }
              break
            case "purposes":
              if (!purposes.includes(item)) {
                await savePurpose(item)
                savedCount++
              }
              break
          }
        } catch (error) {
          console.error(`Error saving ${item}:`, error)
        }
      }

      setImportMessage(
        `✅ ${savedCount} nieuwe ${type} geïmporteerd! (${items.length - savedCount} duplicaten overgeslagen)`,
      )

      // Reset file input
      if (type === "users" && userFileInputRef.current) userFileInputRef.current.value = ""
      if (type === "products" && productFileInputRef.current) productFileInputRef.current.value = ""
      if (type === "locations" && locationFileInputRef.current) locationFileInputRef.current.value = ""
      if (type === "purposes" && purposeFileInputRef.current) purposeFileInputRef.current.value = ""

      setTimeout(() => setImportMessage(""), 5000)
    } catch (error) {
      setImportError(`Fout bij importeren: ${error instanceof Error ? error.message : "Onbekende fout"}`)
      setTimeout(() => setImportError(""), 5000)
    }
  }

  // Export template functie
  const exportTemplate = (type: "users" | "products" | "locations" | "purposes") => {
    let templateData: string[] = []
    let filename = ""

    switch (type) {
      case "users":
        templateData = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg", "Nieuwe Gebruiker"]
        filename = "gebruikers-template.csv"
        break
      case "products":
        templateData = [
          "Laptop Dell XPS,DELL-XPS-001",
          "Monitor Samsung 24,SAM-MON-002",
          "Muis Logitech,LOG-MOU-003",
          "Toetsenbord Mechanical,MECH-KEY-004",
          "Nieuw Product,NEW-PROD-005",
        ]
        filename = "producten-template.csv"
        break
      case "locations":
        templateData = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis", "Nieuwe Locatie"]
        filename = "locaties-template.csv"
        break
      case "purposes":
        templateData = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie", "Nieuw Doel"]
        filename = "doelen-template.csv"
        break
    }

    const csvContent = templateData.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Registreer nieuw item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

    setIsLoading(true)

    try {
      const now = new Date()
      const productQrcode = products.find((p) => p.name === selectedProduct)?.qrcode || ""

      const newEntry: Omit<RegistrationEntry, "id" | "created_at"> = {
        user: currentUser,
        product: selectedProduct,
        location,
        purpose,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString("nl-NL"),
        time: now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
        qrcode: productQrcode,
      }

      const result = await saveRegistration(newEntry)

      if (result.data) {
        // Reset form
        setSelectedProduct("")
        setLocation("")
        setPurpose("")
        setQrScanResult("")

        // Toon success bericht
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        setImportError("Fout bij opslaan registratie")
      }
    } catch (error) {
      console.error("Error saving registration:", error)
      setImportError("Fout bij opslaan registratie")
    }

    setIsLoading(false)
  }

  // Export naar CSV
  const exportToCSV = () => {
    const filteredEntries = getFilteredAndSortedEntries()
    const headers = ["Datum", "Tijd", "Gebruiker", "Product", "QR Code", "Locatie", "Doel"]
    const csvContent = [
      headers.join(","),
      ...filteredEntries.map((entry) =>
        [
          entry.date,
          entry.time,
          `"${entry.user}"`,
          `"${entry.product}"`,
          `"${entry.qrcode || ""}"`,
          `"${entry.location}"`,
          `"${entry.purpose}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)

    const filterSuffix =
      searchQuery || filterUser !== "all" || filterProduct || filterLocation !== "all" ? "-gefilterd" : ""
    link.setAttribute("download", `product-registraties${filterSuffix}-${new Date().toISOString().split("T")[0]}.csv`)

    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Wijzig de addNewUser functie om direct de gebruiker toe te voegen aan de lijst als fallback
  const addNewUser = async () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      try {
        console.log("addNewUser functie aangeroepen voor:", newUserName.trim())
        const result = await saveUser(newUserName.trim())

        if (result.error) {
          console.error("Fout bij toevoegen gebruiker:", result.error)
          setImportError(`Fout bij toevoegen gebruiker: ${result.error.message || "Onbekende fout"}`)
          setTimeout(() => setImportError(""), 5000)
        } else {
          // Direct de gebruiker toevoegen aan de lijst als fallback voor realtime updates
          if (result.data) {
            console.log("Gebruiker direct toevoegen aan lijst:", result.data)
            setUsers((prevUsers) => [...prevUsers, newUserName.trim()])
          }

          setNewUserName("")
          setImportMessage("✅ Gebruiker toegevoegd!")
          setTimeout(() => setImportMessage(""), 2000)
        }
      } catch (error) {
        console.error("Onverwachte fout bij toevoegen gebruiker:", error)
        setImportError(`Onverwachte fout: ${error instanceof Error ? error.message : "Onbekende fout"}`)
        setTimeout(() => setImportError(""), 5000)
      }
    }
  }

  // Voeg nieuw product toe
  const addNewProduct = async () => {
    if (newProductName.trim()) {
      try {
        const qrcode = newProductQrCode.trim() || ""
        const existingProduct = products.find(
          (p) => p.name === newProductName.trim() || (qrcode && p.qrcode === qrcode),
        )
        if (!existingProduct) {
          await saveProduct({ name: newProductName.trim(), qrcode })
          setNewProductName("")
          setNewProductQrCode("")
          setImportMessage("✅ Product toegevoegd!")
          setTimeout(() => setImportMessage(""), 2000)
        }
      } catch (error) {
        setImportError("Fout bij toevoegen product")
      }
    }
  }

  // Voeg nieuwe locatie toe
  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      try {
        await saveLocation(newLocationName.trim())
        setNewLocationName("")
        setImportMessage("✅ Locatie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      } catch (error) {
        setImportError("Fout bij toevoegen locatie")
      }
    }
  }

  // Voeg nieuw doel toe
  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      try {
        await savePurpose(newPurposeName.trim())
        setNewPurposeName("")
        setImportMessage("✅ Doel toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      } catch (error) {
        setImportError("Fout bij toevoegen doel")
      }
    }
  }

  // Wijzig de removeUser functie om direct de gebruiker te verwijderen uit de lijst als fallback
  const removeUser = async (userToRemove: string) => {
    try {
      console.log("removeUser functie aangeroepen voor:", userToRemove)
      const result = await deleteUser(userToRemove)

      if (result.error) {
        console.error("Fout bij verwijderen gebruiker:", result.error)
        setImportError(`Fout bij verwijderen gebruiker: ${result.error.message || "Onbekende fout"}`)
        setTimeout(() => setImportError(""), 5000)
      } else {
        // Direct de gebruiker verwijderen uit de lijst als fallback voor realtime updates
        console.log("Gebruiker direct verwijderen uit lijst:", userToRemove)
        setUsers((prevUsers) => prevUsers.filter((u) => u !== userToRemove))

        setImportMessage("✅ Gebruiker verwijderd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      console.error("Onverwachte fout bij verwijderen gebruiker:", error)
      setImportError(`Onverwachte fout: ${error instanceof Error ? error.message : "Onbekende fout"}`)
      setTimeout(() => setImportError(""), 5000)
    }
  }

  // Wijzig de removeProduct functie om direct het product te verwijderen uit de lijst als fallback
  const removeProduct = async (productToRemove: Product) => {
    try {
      if (productToRemove.id) {
        console.log("removeProduct aangeroepen voor:", productToRemove)
        const result = await deleteProduct(productToRemove.id)

        if (result.error) {
          console.error("Fout bij verwijderen product:", result.error)
          setImportError(`Fout bij verwijderen product: ${result.error.message || "Onbekende fout"}`)
        } else {
          // Direct het product verwijderen uit de lijst als fallback voor realtime updates
          console.log("Product direct verwijderen uit lijst:", productToRemove.id)
          setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productToRemove.id))

          setImportMessage("✅ Product verwijderd!")
          setTimeout(() => setImportMessage(""), 2000)
        }
      }
    } catch (error) {
      console.error("Onverwachte fout bij verwijderen product:", error)
      setImportError("Fout bij verwijderen product")
    }
  }

  const removeLocation = async (locationToRemove: string) => {
    // Wijzig de removeLocation functie om direct de locatie te verwijderen uit de lijst als fallback
    try {
      console.log("removeLocation aangeroepen voor:", locationToRemove)
      const result = await deleteLocation(locationToRemove)

      if (result.error) {
        console.error("Fout bij verwijderen locatie:", result.error)
        setImportError(`Fout bij verwijderen locatie: ${result.error.message || "Onbekende fout"}`)
      } else {
        // Direct de locatie verwijderen uit de lijst als fallback voor realtime updates
        console.log("Locatie direct verwijderen uit lijst:", locationToRemove)
        setLocations((prevLocations) => prevLocations.filter((l) => l !== locationToRemove))

        setImportMessage("✅ Locatie verwijderd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      console.error("Fout bij verwijderen locatie:", error)
      setImportError("Fout bij verwijderen locatie")
    }
  }

  const removePurpose = async (purposeToRemove: string) => {
    // Wijzig de removePurpose functie om direct het doel te verwijderen uit de lijst als fallback
    try {
      console.log("removePurpose aangeroepen voor:", purposeToRemove)
      const result = await deletePurpose(purposeToRemove)

      if (result.error) {
        console.error("Fout bij verwijderen doel:", result.error)
        setImportError(`Fout bij verwijderen doel: ${result.error.message || "Onbekende fout"}`)
      } else {
        // Direct het doel verwijderen uit de lijst als fallback voor realtime updates
        console.log("Doel direct verwijderen uit lijst:", purposeToRemove)
        setPurposes((prevPurposes) => prevPurposes.filter((p) => p !== purposeToRemove))

        setImportMessage("✅ Doel verwijderd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      console.error("Fout bij verwijderen doel:", error)
      setImportError("Fout bij verwijderen doel")
    }
  }

  // Filter en zoek functies
  const getFilteredAndSortedEntries = () => {
    const filtered = entries.filter((entry) => {
      const searchMatch =
        !searchQuery ||
        entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.qrcode && entry.qrcode.toLowerCase().includes(searchQuery.toLowerCase()))

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Logo en titel sectie */}
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* DEMATIC Logo */}
              <div className="flex-shrink-0">
                <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border">
                  <div className="w-1 h-12 bg-amber-500 mr-4"></div>
                  <div className="text-2xl font-bold text-gray-800 tracking-wide">DEMATIC</div>
                </div>
              </div>

              {/* Divider lijn */}
              <div className="hidden lg:block w-px h-16 bg-gray-300"></div>

              {/* App titel */}
              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Product Registratie</h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">Registreer product gebruik en locatie</p>
              </div>
            </div>

            {/* Status info */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                ></div>
                <span>
                  {connectionStatus === "connected"
                    ? "Database verbonden"
                    : connectionStatus === "connecting"
                      ? "Verbinden..."
                      : "Verbindingsfout"}
                </span>
              </div>
              <div className="hidden md:block">{entries.length} registraties</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ Product succesvol geregistreerd!</AlertDescription>
          </Alert>
        )}

        {/* Import berichten */}
        {importMessage && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">{importMessage}</AlertDescription>
          </Alert>
        )}

        {importError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{importError}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Registreren
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
              Geschiedenis ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
              Gebruikers ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Producten ({products.length})
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Locaties ({locations.length})
            </TabsTrigger>
            <TabsTrigger
              value="purposes"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Doelen ({purposes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📦 Nieuw Product Registreren</CardTitle>
                <CardDescription>Scan een QR code of vul onderstaande gegevens handmatig in</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">👤 Gebruiker</Label>
                      <Select value={currentUser} onValueChange={setCurrentUser} required>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecteer gebruiker" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">📦 Product</Label>
                      <div className="flex gap-2">
                        <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                          <SelectTrigger className="h-12 flex-1">
                            <SelectValue placeholder="Selecteer een product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.name}>
                                {product.name} {product.qrcode && `(${product.qrcode})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => {
                            setQrScanMode("registration")
                            startQrScanner()
                          }}
                          className="h-12 px-4 bg-blue-600 hover:bg-blue-700"
                          disabled={showQrScanner}
                        >
                          📱 Scan QR
                        </Button>
                      </div>
                      {qrScanResult && <p className="text-sm text-green-600">✅ QR Code gescand: {qrScanResult}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">📍 Locatie</Label>
                      <Select value={location} onValueChange={setLocation} required>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecteer een locatie" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">🎯 Doel</Label>
                      <Select value={purpose} onValueChange={setPurpose} required>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecteer een doel" />
                        </SelectTrigger>
                        <SelectContent>
                          {purposes.map((purposeItem) => (
                            <SelectItem key={purposeItem} value={purposeItem}>
                              {purposeItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* QR Scanner Modal */}
                  {showQrScanner && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">📱 QR Code Scanner</h3>
                          <Button onClick={stopQrScanner} variant="outline" size="sm">
                            ✕ Sluiten
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <video ref={videoRef} className="w-full h-64 bg-gray-200 rounded-lg" autoPlay playsInline />
                          <canvas ref={canvasRef} className="hidden" />

                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">Richt de camera op een QR code</p>
                            <Button onClick={scanQrCode} className="w-full">
                              🔍 Handmatig Scannen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 h-14 text-lg font-medium"
                    disabled={isLoading || connectionStatus !== "connected"}
                  >
                    {isLoading ? "Bezig met registreren..." : "💾 Product Registreren"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">📋 Registratie Geschiedenis</CardTitle>
                    <CardDescription>
                      Overzicht van alle geregistreerde producten ({getFilteredAndSortedEntries().length} van{" "}
                      {entries.length} producten ({getFilteredAndSortedEntries().length} van {entries.length}
                      items)
                    </CardDescription>
                  </div>
                  {entries.length > 0 && (
                    <Button onClick={exportToCSV} variant="outline" className="bg-white">
                      📥 Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Zoek en Filter Sectie */}
                <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">🔍 Zoeken & Filteren</h3>
                    <Button onClick={clearAllFilters} variant="outline" size="sm">
                      🗑️ Wis filters
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search">Zoeken</Label>
                    <Input
                      id="search"
                      placeholder="Zoek in alle velden (inclusief QR codes)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>👤 Gebruiker</Label>
                      <Select value={filterUser} onValueChange={setFilterUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle gebruikers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle gebruikers</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>📦 Product</Label>
                      <Input
                        placeholder="Zoek product..."
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>📍 Locatie</Label>
                      <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle locaties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle locaties</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>📊 Sorteren</Label>
                      <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={(value: "date" | "user" | "product") => setSortBy(value)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Datum</SelectItem>
                            <SelectItem value="user">Gebruiker</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                          className="px-3"
                        >
                          {sortOrder === "asc" ? "⬆️" : "⬇️"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom">📅 Van datum</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo">📅 Tot datum</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Resultaten */}
                {getFilteredAndSortedEntries().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {entries.length === 0
                      ? "Nog geen registraties. Begin met het registreren van een product!"
                      : "Geen resultaten gevonden voor de huidige filters."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredAndSortedEntries().map((entry) => (
                      <div
                        key={entry.id}
                        className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {entry.user}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {entry.date} om {entry.time}
                          </span>
                        </div>
                        <h4 className="font-semibold text-lg mb-2">{entry.product}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {entry.qrcode && (
                            <div className="flex items-center gap-2">
                              <span>📱</span>
                              <span>QR Code: {entry.qrcode}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>Locatie: {entry.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🎯</span>
                            <span>Doel: {entry.purpose}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">👤➕ Gebruikers Beheren</CardTitle>
                  <CardDescription>Voeg handmatig gebruikers toe of importeer vanuit een bestand</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Handmatig toevoegen */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">Handmatig toevoegen</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Voer gebruikersnaam in"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewUser()}
                        className="h-12"
                      />
                      <Button
                        onClick={addNewUser}
                        disabled={!newUserName.trim() || connectionStatus !== "connected"}
                        className="bg-amber-600 hover:bg-amber-700 h-12 px-6"
                      >
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Import sectie */}
                  <div className="border-t pt-6">
                    <Label className="text-base font-medium mb-4 block">📁 Import vanuit bestand</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Selecteer CSV/TXT bestand</Label>
                        <Input
                          ref={userFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "users")
                          }}
                          className="h-12"
                          disabled={connectionStatus !== "connected"}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ondersteunde formaten: CSV, TXT (één gebruiker per regel)
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button onClick={() => exportTemplate("users")} variant="outline" className="h-12">
                          📥 Download Template
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Download een voorbeeldbestand om te zien hoe het formaat eruit moet zien
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Gebruikers Lijst ({users.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <span className="font-medium">👤 {user}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeUser(user)}
                          className="text-red-600 hover:text-red-700"
                          disabled={connectionStatus !== "connected"}
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">📦 Producten Beheren</CardTitle>
                  <CardDescription>
                    Voeg handmatig producten toe of importeer vanuit een bestand (Formaat: Naam,QR-Code)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Handmatig toevoegen */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">Handmatig toevoegen</Label>
                    <div className="grid grid-cols-1 gap-2 mb-2">
                      <Input
                        placeholder="Voer productnaam in"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="h-12"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Voer QR/EAN code in (optioneel)"
                          value={newProductQrCode}
                          onChange={(e) => setNewProductQrCode(e.target.value)}
                          className="h-12 flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            startQrScanner()
                            setQrScanMode("product-management")
                          }}
                          className="h-12 px-4 bg-blue-600 hover:bg-blue-700"
                          disabled={showQrScanner}
                        >
                          📱 Scan
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={addNewProduct}
                      disabled={!newProductName.trim() || connectionStatus !== "connected"}
                      className="bg-amber-600 hover:bg-amber-700 h-12 px-6 w-full md:w-auto"
                    >
                      Toevoegen
                    </Button>
                  </div>

                  {/* Import sectie */}
                  <div className="border-t pt-6">
                    <Label className="text-base font-medium mb-4 block">📁 Import vanuit bestand</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Selecteer CSV bestand</Label>
                        <Input
                          ref={productFileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "products")
                          }}
                          className="h-12"
                          disabled={connectionStatus !== "connected"}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          CSV formaat: Productnaam,QR-Code (één product per regel)
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button onClick={() => exportTemplate("products")} variant="outline" className="h-12">
                          📥 Download Template
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Download een voorbeeldbestand met het juiste formaat
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Producten Lijst ({products.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white"
                      >
                        <div>
                          <span className="font-medium">📦 {product.name}</span>
                          <div className="text-sm text-gray-500">
                            {product.qrcode ? `QR: ${product.qrcode}` : "Geen QR code"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeProduct(product)}
                          className="text-red-600 hover:text-red-700"
                          disabled={connectionStatus !== "connected"}
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">📍 Locaties Beheren</CardTitle>
                  <CardDescription>Voeg handmatig locaties toe of importeer vanuit een bestand</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Handmatig toevoegen */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">Handmatig toevoegen</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Voer locatienaam in"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewLocation()}
                        className="h-12"
                      />
                      <Button
                        onClick={addNewLocation}
                        disabled={!newLocationName.trim() || connectionStatus !== "connected"}
                        className="bg-amber-600 hover:bg-amber-700 h-12 px-6"
                      >
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Import sectie */}
                  <div className="border-t pt-6">
                    <Label className="text-base font-medium mb-4 block">📁 Import vanuit bestand</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Selecteer CSV/TXT bestand</Label>
                        <Input
                          ref={locationFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "locations")
                          }}
                          className="h-12"
                          disabled={connectionStatus !== "connected"}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ondersteunde formaten: CSV, TXT (één locatie per regel)
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button onClick={() => exportTemplate("locations")} variant="outline" className="h-12">
                          📥 Download Template
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Download een voorbeeldbestand om te zien hoe het formaat eruit moet zien
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Locaties Lijst ({locations.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <span className="font-medium">📍 {loc}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeLocation(loc)}
                          className="text-red-600 hover:text-red-700"
                          disabled={connectionStatus !== "connected"}
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="purposes">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">🎯 Doelen Beheren</CardTitle>
                  <CardDescription>Voeg handmatig doelen toe of importeer vanuit een bestand</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Handmatig toevoegen */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">Handmatig toevoegen</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Voer doel/toepassing in"
                        value={newPurposeName}
                        onChange={(e) => setNewPurposeName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewPurpose()}
                        className="h-12"
                      />
                      <Button
                        onClick={addNewPurpose}
                        disabled={!newPurposeName.trim() || connectionStatus !== "connected"}
                        className="bg-amber-600 hover:bg-amber-700 h-12 px-6"
                      >
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Import sectie */}
                  <div className="border-t pt-6">
                    <Label className="text-base font-medium mb-4 block">📁 Import vanuit bestand</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Selecteer CSV/TXT bestand</Label>
                        <Input
                          ref={purposeFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "purposes")
                          }}
                          className="h-12"
                          disabled={connectionStatus !== "connected"}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ondersteunde formaten: CSV, TXT (één doel per regel)
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button onClick={() => exportTemplate("purposes")} variant="outline" className="h-12">
                          📥 Download Template
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Download een voorbeeldbestand om te zien hoe het formaat eruit moet zien
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Doelen Lijst ({purposes.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {purposes.map((purposeItem) => (
                      <div
                        key={purposeItem}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white"
                      >
                        <span className="font-medium">🎯 {purposeItem}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePurpose(purposeItem)}
                          className="text-red-600 hover:text-red-700"
                          disabled={connectionStatus !== "connected"}
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Footer logo */}
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex items-center mr-4">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20FB%20transparant.jpg-JHmdbCgpI0bC4vPXL5gWiWBoMSbPlJ.jpeg"
                  alt="Interflon Logo"
                  className="w-8 h-8 mr-2"
                />
                <div className="text-lg font-bold text-gray-700">INTERFLON</div>
              </div>
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} INTERFLON. Alle rechten voorbehouden.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-amber-600">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-amber-600">
                Voorwaarden
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-amber-600">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
