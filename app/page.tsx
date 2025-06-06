"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  saveProduct,
  updateProduct,
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
  fetchProducts,
  fetchProductsWithCategories,
} from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search, X } from "lucide-react"
import {
  QrCode,
  FileText,
  Plus,
  Trash2,
  Users,
  Package,
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  Edit,
  Filter,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { getCurrentUser, onAuthStateChange, signOut } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import {
  fetchCategories,
  saveCategory,
  updateCategory,
  deleteCategory,
  subscribeToCategories,
  type ProductCategory,
} from "@/lib/supabase"
import { CategoryManagement } from "@/components/category-management"

export default function ProductRegistrationApp() {
  // Fix JWT error
  if (typeof window !== "undefined") {
    localStorage.removeItem("supabase.auth.token")
    sessionStorage.clear()
  }
  const [currentUser, setCurrentUser] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
  const [entries, setEntries] = useState<RegistrationEntry[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [user, setUser] = useState<any>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Beheer states
  const [users, setUsers] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])

  // Nieuwe item states
  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newProductQrCode, setNewProductQrCode] = useState("")
  const [newProductCategoryId, setNewProductCategoryId] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")

  // Product edit states
  const [showEditProductDialog, setShowEditProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editProductName, setEditProductName] = useState("")
  const [editProductQrCode, setEditProductQrCode] = useState("")
  const [editProductCategoryId, setEditProductCategoryId] = useState("")

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState("")
  const [qrScanMode, setQrScanMode] = useState<"registration" | "product-management">("registration")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Product filter states
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productCategoryFilter, setProductCategoryFilter] = useState("all")

  // Categorieën states
  const [categories, setCategories] = useState<ProductCategory[]>([])

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
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [cameraStream])

  // Authentication check
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsAuthLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setUser(user)
      setIsAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadAllData = async () => {
    try {
      setConnectionStatus("connecting")

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Supabase omgevingsvariabelen ontbreken")
        setConnectionStatus("error")
        setImportError("❌ Fout bij verbinden met database: Configuratie ontbreekt")
        return
      }

      const [usersResult, locationsResult, purposesResult, registrationsResult] = await Promise.all([
        fetchUsers(),
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

      if (locationsResult.data) setLocations(locationsResult.data)
      if (purposesResult.data) setPurposes(purposesResult.data)
      if (registrationsResult.data) setEntries(registrationsResult.data)

      // Load categories first
      try {
        const categoriesResult = await fetchCategories()
        if (categoriesResult.data) {
          setCategories(categoriesResult.data)
        }
      } catch (error) {
        console.warn("Could not load categories:", error)
        setCategories([])
      }

      // Then load products with categories
      try {
        const productsResult = await fetchProductsWithCategories()
        if (productsResult.data) {
          setProducts(productsResult.data)
        } else {
          // Fallback to regular products if categories don't work
          const fallbackResult = await fetchProducts()
          if (fallbackResult.data) {
            setProducts(fallbackResult.data)
          }
        }
      } catch (error) {
        console.warn("Could not load products with categories, trying fallback:", error)
        try {
          const fallbackResult = await fetchProducts()
          if (fallbackResult.data) {
            setProducts(fallbackResult.data)
          }
        } catch (fallbackError) {
          console.error("Could not load products at all:", fallbackError)
          setProducts([])
        }
      }

      setConnectionStatus("connected")
      setImportMessage("✅ Verbonden met database - alle data gesynchroniseerd!")
      setTimeout(() => setImportMessage(""), 3000)
    } catch (error) {
      console.error("Error loading data:", error)
      setConnectionStatus("error")
      setImportError(`❌ Fout bij verbinden met database: ${error instanceof Error ? error.message : "Onbekende fout"}`)
    }
  }

  const setupRealtimeSubscriptions = () => {
    console.log("Setting up realtime subscriptions...")

    try {
      const unsubscribeProducts = subscribeToProducts(async (updatedProducts) => {
        console.log("Products subscription update received:", updatedProducts.length)
        // Try to reload products with categories, fallback to regular products
        try {
          const result = await fetchProductsWithCategories()
          if (result.data) {
            setProducts(result.data)
          } else {
            setProducts(updatedProducts)
          }
        } catch (error) {
          console.warn("Error reloading products with categories:", error)
          setProducts(updatedProducts)
        }
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

      const unsubscribeCategories = subscribeToCategories((updatedCategories) => {
        console.log("Categories subscription update received:", updatedCategories.length)
        setCategories(updatedCategories)
      })

      console.log("All realtime subscriptions set up successfully")

      return () => {
        console.log("Cleaning up subscriptions...")
        if (unsubscribeProducts) unsubscribeProducts.unsubscribe()
        if (unsubscribeUsers) unsubscribeUsers.unsubscribe()
        if (unsubscribeLocations) unsubscribeLocations.unsubscribe()
        if (unsubscribePurposes) unsubscribePurposes.unsubscribe()
        if (unsubscribeRegistrations) unsubscribeRegistrations.unsubscribe()
        if (unsubscribeCategories) unsubscribeCategories.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up realtime subscriptions:", error)
      setImportError("Fout bij het opzetten van realtime updates. Vernieuw de pagina om het opnieuw te proberen.")
      return () => {}
    }
  }

  // Eenvoudige QR code detectie functie
  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    // Hier zou normaal een QR code library gebruikt worden
    // Voor nu simuleren we QR code detectie door te kijken naar donkere pixels
    // Dit is een zeer eenvoudige implementatie

    // In een echte implementatie zou je een library zoals jsQR gebruiken:
    // const code = jsQR(imageData.data, imageData.width, imageData.height)
    // if (code) {
    //   handleQrCodeDetected(code.data)
    // }
  }

  const startQrScanner = async () => {
    try {
      console.log("Starting QR scanner...")

      // Toon eerst de modal
      setShowQrScanner(true)
      setIsScanning(true)

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("Camera not supported, showing manual input")
        setIsScanning(false)
        return
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      console.log("Camera stream obtained:", stream)
      setCameraStream(stream)

      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log("Setting video source...")
          videoRef.current.srcObject = stream
          videoRef.current
            .play()
            .then(() => {
              // Start scanning for QR codes
              scanIntervalRef.current = setInterval(detectQRCode, 500) // Scan every 500ms
            })
            .catch(console.error)
        }
      }, 100)
    } catch (error) {
      console.error("Camera error:", error)
      setIsScanning(false)
      // Modal is already open, just show manual input option
    }
  }

  const stopQrScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setShowQrScanner(false)
    setIsScanning(false)
  }

  const scanQrCode = () => {
    const qrInput = prompt("Voer QR code in:")
    if (qrInput && qrInput.trim()) {
      handleQrCodeDetected(qrInput.trim())
    }
  }

  const handleQrCodeDetected = (qrCode: string) => {
    console.log("QR Code detected:", qrCode)
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
        console.log("Registratie direct toevoegen aan lijst:", result.data)
        setEntries((prevEntries) => [result.data, ...prevEntries])

        setSelectedProduct("")
        setLocation("")
        setPurpose("")
        setQrScanResult("")

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

  const addNewProduct = async () => {
    if (newProductName.trim()) {
      try {
        const qrcode = newProductQrCode.trim() || ""
        const category_id = newProductCategoryId || undefined
        const existingProduct = products.find(
          (p) => p.name === newProductName.trim() || (qrcode && p.qrcode === qrcode),
        )
        if (!existingProduct) {
          console.log("addNewProduct aangeroepen voor:", newProductName.trim())
          const result = await saveProduct({
            name: newProductName.trim(),
            qrcode,
            category_id,
          })

          if (result.error) {
            console.error("Fout bij toevoegen product:", result.error)
            setImportError(`Fout bij toevoegen product: ${result.error.message || "Onbekende fout"}`)
          } else {
            // Reload products with categories
            const updatedProducts = await fetchProductsWithCategories()
            if (updatedProducts.data) {
              setProducts(updatedProducts.data)
            }

            setNewProductName("")
            setNewProductQrCode("")
            setNewProductCategoryId("")
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setEditProductName(product.name)
    setEditProductQrCode(product.qrcode || "")
    setEditProductCategoryId(product.category_id || "")
    setShowEditProductDialog(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct?.id || !editProductName.trim()) return

    try {
      const result = await updateProduct(editingProduct.id, {
        name: editProductName.trim(),
        qrcode: editProductQrCode.trim() || undefined,
        category_id: editProductCategoryId || undefined,
      })

      if (result.error) {
        setImportError(`Fout bij bijwerken product: ${result.error.message || "Onbekende fout"}`)
      } else {
        // Reload products with categories
        const updatedProducts = await fetchProductsWithCategories()
        if (updatedProducts.data) {
          setProducts(updatedProducts.data)
        }

        setShowEditProductDialog(false)
        setEditingProduct(null)
        setImportMessage("✅ Product bijgewerkt!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      console.error("Fout bij bijwerken product:", error)
      setImportError("Fout bij bijwerken product")
    }
  }

  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      try {
        console.log("addNewLocation aangeroepen voor:", newLocationName.trim())
        const result = await saveLocation(newLocationName.trim())

        if (result.error) {
          console.error("Fout bij toevoegen locatie:", result.error)
          setImportError(`Fout bij toevoegen locatie: ${result.error.message || "Onbekende fout"}`)
        } else {
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

  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      try {
        console.log("addNewPurpose aangeroepen voor:", newPurposeName.trim())
        const result = await savePurpose(newPurposeName.trim())

        if (result.error) {
          console.error("Fout bij toevoegen doel:", result.error)
          setImportError(`Fout bij toevoegen doel: ${result.error.message || "Onbekende fout"}`)
        } else {
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

  const removeUser = async (userToRemove: string) => {
    try {
      console.log("removeUser functie aangeroepen voor:", userToRemove)
      const result = await deleteUser(userToRemove)

      if (result.error) {
        console.error("Fout bij verwijderen gebruiker:", result.error)
        setImportError(`Fout bij verwijderen gebruiker: ${result.error.message || "Onbekende fout"}`)
        setTimeout(() => setImportError(""), 5000)
      } else {
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

  const removeProduct = async (productToRemove: Product) => {
    try {
      if (productToRemove.id) {
        console.log("removeProduct aangeroepen voor:", productToRemove)
        const result = await deleteProduct(productToRemove.id)

        if (result.error) {
          console.error("Fout bij verwijderen product:", result.error)
          setImportError(`Fout bij verwijderen product: ${result.error.message || "Onbekende fout"}`)
        } else {
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
    try {
      console.log("removeLocation functie aangeroepen voor:", locationToRemove)
      const result = await deleteLocation(locationToRemove)

      if (result.error) {
        console.error("Fout bij verwijderen locatie:", result.error)
        setImportError(`Fout bij verwijderen locatie: ${result.error.message || "Onbekende fout"}`)
      } else {
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
    try {
      console.log("removePurpose functie aangeroepen voor:", purposeToRemove)
      const result = await deletePurpose(purposeToRemove)

      if (result.error) {
        console.error("Fout bij verwijderen doel:", result.error)
        setImportError(`Fout bij verwijderen doel: ${result.error.message || "Onbekende fout"}`)
      } else {
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

  const handleAddCategory = async (categoryData: Omit<ProductCategory, "id" | "created_at">) => {
    try {
      const result = await saveCategory(categoryData)
      if (result.error) {
        const errorMessage = result.error.message || "Onbekende fout bij toevoegen categorie"
        setImportError(`Fout bij toevoegen categorie: ${errorMessage}`)
        setTimeout(() => setImportError(""), 5000)
      } else {
        setImportMessage("✅ Categorie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Onbekende fout"
      setImportError(`Fout bij toevoegen categorie: ${errorMessage}`)
      setTimeout(() => setImportError(""), 5000)
    }
  }

  const handleUpdateCategory = async (id: string, categoryData: Partial<ProductCategory>) => {
    try {
      const result = await updateCategory(id, categoryData)
      if (result.error) {
        const errorMessage = result.error.message || "Onbekende fout bij bijwerken categorie"
        setImportError(`Fout bij bijwerken categorie: ${errorMessage}`)
        setTimeout(() => setImportError(""), 5000)
      } else {
        setImportMessage("✅ Categorie bijgewerkt!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Onbekende fout"
      setImportError(`Fout bij bijwerken categorie: ${errorMessage}`)
      setTimeout(() => setImportError(""), 5000)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const result = await deleteCategory(id)
      if (result.error) {
        const errorMessage = result.error.message || "Onbekende fout bij verwijderen categorie"
        setImportError(`Fout bij verwijderen categorie: ${errorMessage}`)
        setTimeout(() => setImportError(""), 5000)
      } else {
        setImportMessage("✅ Categorie verwijderd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Onbekende fout"
      setImportError(`Fout bij verwijderen categorie: ${errorMessage}`)
      setTimeout(() => setImportError(""), 5000)
    }
  }

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

  const getFilteredProducts = () => {
    return products.filter((product) => {
      const searchMatch =
        !productSearchQuery ||
        product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (product.qrcode && product.qrcode.toLowerCase().includes(productSearchQuery.toLowerCase()))

      const categoryMatch =
        productCategoryFilter === "all" ||
        product.category_id === productCategoryFilter ||
        (!product.category_id && productCategoryFilter === "none")

      return searchMatch && categoryMatch
    })
  }

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

  const calculateStatistics = () => {
    const totalRegistrations = entries.length
    const uniqueUsers = new Set(entries.map((entry) => entry.user)).size
    const uniqueProducts = new Set(entries.map((entry) => entry.product)).size

    const userCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      userCounts[entry.user] = (userCounts[entry.user] || 0) + 1
    })
    const topUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const productCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      productCounts[entry.product] = (productCounts[entry.product] || 0) + 1
    })
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const locationCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      locationCounts[entry.location] = (locationCounts[entry.location] || 0) + 1
    })
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const recentActivity = [...entries]
      .sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      .slice(0, 10)

    return {
      totalRegistrations,
      uniqueUsers,
      uniqueProducts,
      topUsers,
      topProducts,
      topLocations,
      recentActivity,
    }
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
  }

  const stats = calculateStatistics()

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm onLogin={() => setUser(user)} />
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logout button */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center bg-white p-4 rounded-lg shadow-sm border">
                  <div className="w-1 h-12 bg-amber-500 mr-4"></div>
                  <div className="text-2xl font-bold text-gray-800 tracking-wide">DEMATIC</div>
                </div>
              </div>

              <div className="hidden lg:block w-px h-16 bg-gray-300"></div>

              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Product Registratie</h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">Registreer product gebruik en locatie</p>
              </div>
            </div>

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
              <div className="flex items-center gap-2">
                <span>Ingelogd als: {user.email}</span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Uitloggen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Rest of your existing app content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ Product succesvol geregistreerd!</AlertDescription>
          </Alert>
        )}

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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 bg-white border border-gray-200 shadow-sm">
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
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Statistieken
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
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">👤 Gebruiker</Label>
                      <Select value={currentUser} onValueChange={setCurrentUser} required>
                        <SelectTrigger className="h-10 sm:h-12">
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
                      <Label className="text-sm sm:text-base font-medium">📦 Product</Label>
                      <div className="flex gap-2">
                        <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                          <SelectTrigger className="h-10 sm:h-12 flex-1">
                            <SelectValue placeholder="Selecteer een product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.name}>
                                <div className="flex items-center gap-2">
                                  {product.category && (
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: product.category.color }}
                                    />
                                  )}
                                  {product.name} {product.qrcode && `(${product.qrcode})`}
                                </div>
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
                          className="h-10 sm:h-12 px-4 bg-blue-600 hover:bg-blue-700"
                          disabled={showQrScanner}
                        >
                          📱 Scan QR
                        </Button>
                      </div>
                      {qrScanResult && <p className="text-sm text-green-600">✅ QR Code gescand: {qrScanResult}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">📍 Locatie</Label>
                      <Select value={location} onValueChange={setLocation} required>
                        <SelectTrigger className="h-10 sm:h-12">
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
                      <Label className="text-sm sm:text-base font-medium">🎯 Doel</Label>
                      <Select value={purpose} onValueChange={setPurpose} required>
                        <SelectTrigger className="h-10 sm:h-12">
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

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 h-12 sm:h-14 text-base sm:text-lg font-medium"
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
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📋 Registratie Geschiedenis</CardTitle>
                <CardDescription>Bekijk en filter alle product registraties</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Label htmlFor="search" className="text-sm font-medium mb-1 block">
                          Zoeken
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            id="search"
                            type="text"
                            placeholder="Zoek op naam, product, locatie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="filterUser" className="text-sm font-medium mb-1 block">
                          Gebruiker
                        </Label>
                        <Select value={filterUser} onValueChange={setFilterUser}>
                          <SelectTrigger id="filterUser">
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
                      <div className="w-full sm:w-48">
                        <Label htmlFor="filterLocation" className="text-sm font-medium mb-1 block">
                          Locatie
                        </Label>
                        <Select value={filterLocation} onValueChange={setFilterLocation}>
                          <SelectTrigger id="filterLocation">
                            <SelectValue placeholder="Alle locaties" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle locaties</SelectItem>
                            {locations.map((loc) => (
                              <SelectItem key={loc} value={loc}>
                                {loc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-48">
                        <Label htmlFor="dateFrom" className="text-sm font-medium mb-1 block">
                          Datum vanaf
                        </Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="dateTo" className="text-sm font-medium mb-1 block">
                          Datum tot
                        </Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="sortBy" className="text-sm font-medium mb-1 block">
                          Sorteer op
                        </Label>
                        <Select
                          value={sortBy}
                          onValueChange={(value) => setSortBy(value as "date" | "user" | "product")}
                        >
                          <SelectTrigger id="sortBy">
                            <SelectValue placeholder="Sorteer op" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Datum</SelectItem>
                            <SelectItem value="user">Gebruiker</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="sortOrder" className="text-sm font-medium mb-1 block">
                          Volgorde
                        </Label>
                        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                          <SelectTrigger id="sortOrder">
                            <SelectValue placeholder="Volgorde" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Nieuwste eerst</SelectItem>
                            <SelectItem value="asc">Oudste eerst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={clearAllFilters} className="text-sm">
                        <X className="mr-1 h-4 w-4" /> Wis filters
                      </Button>
                      <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-sm">
                        <Download className="mr-1 h-4 w-4" /> Exporteer naar CSV
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[100px]">Datum</TableHead>
                          <TableHead className="w-[80px]">Tijd</TableHead>
                          <TableHead>Gebruiker</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="hidden md:table-cell">QR Code</TableHead>
                          <TableHead>Locatie</TableHead>
                          <TableHead className="hidden md:table-cell">Doel</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredAndSortedEntries().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              Geen registraties gevonden met de huidige filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredAndSortedEntries().map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">{entry.date}</TableCell>
                              <TableCell>{entry.time}</TableCell>
                              <TableCell>{entry.user}</TableCell>
                              <TableCell>{entry.product}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {entry.qrcode ? (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {entry.qrcode}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>{entry.location}</TableCell>
                              <TableCell className="hidden md:table-cell">{entry.purpose}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    {getFilteredAndSortedEntries().length} van {entries.length} registraties weergegeven
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">👥 Gebruikers Beheer</CardTitle>
                <CardDescription>Beheer gebruikers die producten kunnen registreren</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Nieuwe gebruiker toevoegen</h3>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Naam van nieuwe gebruiker"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewUser()}
                        className="flex-1"
                      />
                      <Button onClick={addNewUser} disabled={!newUserName.trim()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Bulk import</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          ref={userFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "users")
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={() => exportTemplate("users")}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Template
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">Upload een CSV of TXT bestand met één gebruiker per regel</p>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Naam</TableHead>
                          <TableHead className="w-[100px] text-right">Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                              Nog geen gebruikers toegevoegd
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user}>
                              <TableCell className="font-medium">{user}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => removeUser(user)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📦 Producten Beheer</CardTitle>
                <CardDescription>Beheer producten die geregistreerd kunnen worden</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Nieuw product toevoegen</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Naam van nieuw product"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="QR Code (optioneel)"
                            value={newProductQrCode}
                            onChange={(e) => setNewProductQrCode(e.target.value)}
                            className="w-40"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setQrScanMode("product-management")
                              startQrScanner()
                            }}
                            variant="outline"
                            className="px-3"
                            disabled={showQrScanner}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select value={newProductCategoryId} onValueChange={setNewProductCategoryId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecteer categorie (optioneel)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Geen categorie</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id || ""}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={addNewProduct} disabled={!newProductName.trim()}>
                          <Plus className="h-4 w-4 mr-1" />
                          Toevoegen
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Bulk import</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          ref={productFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "products")
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={() => exportTemplate("products")}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Template
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Upload een CSV bestand met formaat: Productnaam,QRCode (één product per regel)
                      </p>
                    </div>
                  </div>

                  {/* Product filters */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Label htmlFor="productSearch" className="text-sm font-medium mb-1 block">
                          Zoeken
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            id="productSearch"
                            type="text"
                            placeholder="Zoek op naam of QR code..."
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="categoryFilter" className="text-sm font-medium mb-1 block">
                          Categorie
                        </Label>
                        <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                          <SelectTrigger id="categoryFilter">
                            <SelectValue placeholder="Alle categorieën" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle categorieën</SelectItem>
                            <SelectItem value="none">Geen categorie</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id || ""}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProductSearchQuery("")
                            setProductCategoryFilter("all")
                          }}
                          className="text-sm"
                        >
                          <X className="mr-1 h-4 w-4" /> Wis filters
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Naam</TableHead>
                          <TableHead className="hidden md:table-cell">QR Code</TableHead>
                          <TableHead className="hidden md:table-cell">Categorie</TableHead>
                          <TableHead className="w-[120px] text-right">Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredProducts().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              {productSearchQuery || productCategoryFilter !== "all"
                                ? "Geen producten gevonden met de huidige filters"
                                : "Nog geen producten toegevoegd"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredProducts().map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {product.qrcode ? (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {product.qrcode}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {product.category ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: product.category.color }}
                                    />
                                    <span className="text-sm">{product.category.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    onClick={() => handleEditProduct(product)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => removeProduct(product)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    {getFilteredProducts().length} van {products.length} producten weergegeven
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categorieën sectie */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <CategoryManagement
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📍 Locaties Beheer</CardTitle>
                <CardDescription>Beheer locaties waar producten gebruikt kunnen worden</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Nieuwe locatie toevoegen</h3>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Naam van nieuwe locatie"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewLocation()}
                        className="flex-1"
                      />
                      <Button onClick={addNewLocation} disabled={!newLocationName.trim()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Bulk import</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          ref={locationFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "locations")
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={() => exportTemplate("locations")}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Template
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">Upload een CSV of TXT bestand met één locatie per regel</p>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Naam</TableHead>
                          <TableHead className="w-[100px] text-right">Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                              Nog geen locaties toegevoegd
                            </TableCell>
                          </TableRow>
                        ) : (
                          locations.map((location) => (
                            <TableRow key={location}>
                              <TableCell className="font-medium">{location}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => removeLocation(location)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purposes">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">🎯 Doelen Beheer</CardTitle>
                <CardDescription>Beheer doelen waarvoor producten gebruikt kunnen worden</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Nieuw doel toevoegen</h3>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Naam van nieuw doel"
                        value={newPurposeName}
                        onChange={(e) => setNewPurposeName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewPurpose()}
                        className="flex-1"
                      />
                      <Button onClick={addNewPurpose} disabled={!newPurposeName.trim()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-3">Bulk import</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          ref={purposeFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "purposes")
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={() => exportTemplate("purposes")}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Template
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">Upload een CSV of TXT bestand met één doel per regel</p>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Naam</TableHead>
                          <TableHead className="w-[100px] text-right">Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purposes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                              Nog geen doelen toegevoegd
                            </TableCell>
                          </TableRow>
                        ) : (
                          purposes.map((purpose) => (
                            <TableRow key={purpose}>
                              <TableCell className="font-medium">{purpose}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => removePurpose(purpose)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totaal Registraties</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
                    <p className="text-xs text-muted-foreground">Alle tijd</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                    <p className="text-xs text-muted-foreground">Unieke gebruikers</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Geregistreerde Producten</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
                    <p className="text-xs text-muted-foreground">Verschillende producten</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gemiddeld per Dag</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {entries.length > 0
                        ? Math.round(
                            entries.length /
                              Math.max(
                                1,
                                Math.ceil(
                                  (new Date().getTime() - new Date(entries[entries.length - 1].timestamp).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              ),
                          )
                        : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Registraties per dag</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Top 5 Gebruikers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topUsers.map(([user, count], index) => (
                        <div key={user} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium">{user}</span>
                          </div>
                          <Badge variant="secondary">{count} registraties</Badge>
                        </div>
                      ))}
                      {stats.topUsers.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Nog geen data beschikbaar</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Top 5 Producten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topProducts.map(([product, count], index) => (
                        <div key={product} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium">{product}</span>
                          </div>
                          <Badge variant="secondary">{count} keer gebruikt</Badge>
                        </div>
                      ))}
                      {stats.topProducts.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Nog geen data beschikbaar</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Top 5 Locaties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topLocations.map(([location, count], index) => (
                        <div key={location} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium">{location}</span>
                          </div>
                          <Badge variant="secondary">{count} registraties</Badge>
                        </div>
                      ))}
                      {stats.topLocations.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Nog geen data beschikbaar</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recente Activiteit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recentActivity.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">{entry.user}</div>
                            <div className="text-gray-500">{entry.product}</div>
                          </div>
                          <div className="text-right text-gray-500">
                            <div>{entry.date}</div>
                            <div>{entry.time}</div>
                          </div>
                        </div>
                      ))}
                      {stats.recentActivity.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Nog geen activiteit</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* QR Scanner Modal */}
        <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>QR Code Scanner</DialogTitle>
              <DialogDescription>
                {qrScanMode === "registration"
                  ? "Scan de QR code van het product dat je wilt registreren"
                  : "Scan de QR code voor het nieuwe product"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isScanning && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg"
                    autoPlay
                    playsInline
                    muted
                    style={{ objectFit: "cover" }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-amber-400 rounded-lg"></div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="manualQr">Of voer QR code handmatig in:</Label>
                <Input
                  id="manualQr"
                  type="text"
                  placeholder="QR code..."
                  value={qrScanResult}
                  onChange={(e) => setQrScanResult(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={stopQrScanner}>
                Annuleren
              </Button>
              <Button
                onClick={() => {
                  if (qrScanResult.trim()) {
                    handleQrCodeDetected(qrScanResult.trim())
                  }
                }}
                disabled={!qrScanResult.trim()}
              >
                Gebruiken
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Product Bewerken</DialogTitle>
              <DialogDescription>Bewerk de gegevens van het product.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editProductName">Naam *</Label>
                <Input
                  id="editProductName"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  placeholder="Productnaam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductQrCode">QR Code</Label>
                <Input
                  id="editProductQrCode"
                  value={editProductQrCode}
                  onChange={(e) => setEditProductQrCode(e.target.value)}
                  placeholder="QR Code (optioneel)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductCategory">Categorie</Label>
                <Select value={editProductCategoryId} onValueChange={setEditProductCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer categorie (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen categorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id || ""}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditProductDialog(false)}>
                Annuleren
              </Button>
              <Button onClick={handleUpdateProduct} disabled={!editProductName.trim()}>
                Wijzigingen Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="relative w-8 h-8 mr-2">
                  <div className="w-8 h-8 border-4 border-red-500 rounded-full relative">
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                <div className="text-sm font-bold text-red-500 tracking-wide">INTERFLON</div>
              </div>
              <div className="text-sm text-gray-500">Product Registratie Systeem</div>
            </div>
            <div className="text-sm text-gray-500">© 2024 INTERFLON. Alle rechten voorbehouden.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
