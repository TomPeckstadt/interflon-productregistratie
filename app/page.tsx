"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
import { Download, Crown } from "lucide-react"

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
        // Direct de registratie toevoegen aan de lijst als fallback voor realtime updates
        console.log("Registratie direct toevoegen aan lijst:", result.data)
        setEntries((prevEntries) => [result.data, ...prevEntries])

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
          console.log("addNewProduct aangeroepen voor:", newProductName.trim())
          const result = await saveProduct({ name: newProductName.trim(), qrcode })

          if (result.error) {
            console.error("Fout bij toevoegen product:", result.error)
            setImportError(`Fout bij toevoegen product: ${result.error.message || "Onbekende fout"}`)
          } else {
            // Direct het product toevoegen aan de lijst als fallback voor realtime updates
            if (result.data) {
              console.log("Product direct toevoegen aan lijst:", result.data)
              setProducts((prevProducts) => [result.data, ...prevProducts])
            }

            setNewProductName("")
            setNewProductQrCode("")
            setImportMessage("✅ Product toegevoegd!")
            setTimeout(() => setImportMessage(""), 2000)
          }
        }
      } catch (error) {
        console.error("Onverwachte fout bij toevoegen product:", error)
        setImportError("Fout bij toevoegen product")
      }
    }
  }

  // Voeg nieuwe locatie toe
  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      try {
        console.log("addNewLocation aangeroepen voor:", newLocationName.trim())
        const result = await saveLocation(newLocationName.trim())

        if (result.error) {
          console.error("Fout bij toevoegen locatie:", result.error)
          setImportError(`Fout bij toevoegen locatie: ${result.error.message || "Onbekende fout"}`)
        } else {
          // Direct de locatie toevoegen aan de lijst als fallback voor realtime updates
          if (result.data) {
            console.log("Locatie direct toevoegen aan lijst:", result.data)
            setLocations((prevLocations) => [newLocationName.trim(), ...prevLocations])
          }

          setNewLocationName("")
          setImportMessage("✅ Locatie toegevoegd!")
          setTimeout(() => setImportMessage(""), 2000)
        }
      } catch (error) {
        console.error("Onverwachte fout bij toevoegen locatie:", error)
        setImportError("Fout bij toevoegen locatie")
      }
    }
  }

  // Voeg nieuw doel toe
  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      try {
        console.log("addNewPurpose aangeroepen voor:", newPurposeName.trim())
        const result = await savePurpose(newPurposeName.trim())

        if (result.error) {
          console.error("Fout bij toevoegen doel:", result.error)
          setImportError(`Fout bij toevoegen doel: ${result.error.message || "Onbekende fout"}`)
        } else {
          // Direct het doel toevoegen aan de lijst als fallback voor realtime updates
          if (result.data) {
            console.log("Doel direct toevoegen aan lijst:", result.data)
            setPurposes((prevPurposes) => [newPurposeName.trim(), ...prevPurposes])
          }

          setNewPurposeName("")
          setImportMessage("✅ Doel toegevoegd!")
          setTimeout(() => setImportMessage(""), 2000)
        }
      } catch (error) {
        console.error("Onverwachte fout bij toevoegen doel:", error)
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
      <div className="bg-white shadow">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Crown className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-semibold">Interflon Product Registratie</h1>
            </div>
            <div className="space-x-4">
              <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                <Download className="inline-block mr-2" size={16} />
                Exporteer Data
              </button>
            </div>
          </div>
          <div className="bg-orange-500 h-1 mt-4 rounded-full shadow-inner"></div>
        </div>
      </div>
      <div className="container mx-auto py-6 px-4">
        <p>Dit is je complete Interflon Product Registratie App</p>
      </div>
    </div>
  )
}
