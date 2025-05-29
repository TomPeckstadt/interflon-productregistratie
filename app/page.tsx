"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Package,
  MapPin,
  Save,
  History,
  CheckCircle,
  Download,
  UserPlus,
  Trash2,
  Target,
  QrCode,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QRScanner } from "@/components/qr-scanner"
import { PhotoUpload } from "@/components/photo-upload"
import { StatisticsDashboard } from "@/components/statistics-dashboard"
import { saveRegistration, getRegistrations, type RegistrationEntry } from "@/lib/supabase"

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

  // Nieuwe functies states
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState<string>("")
  const [scannedQR, setScannedQR] = useState<string>("")

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

    // Probeer eerst Supabase (alleen als geconfigureerd)
    try {
      const { data: supabaseData, error } = await getRegistrations()

      if (!error && supabaseData && supabaseData.length > 0) {
        // Supabase data beschikbaar
        setEntries(supabaseData)
      } else {
        // Fallback naar localStorage
        const savedEntries = localStorage.getItem("productRegistrations")
        if (savedEntries) {
          setEntries(JSON.parse(savedEntries))
        }
      }
    } catch (error) {
      console.log("Supabase not available, using localStorage")
      // Fallback naar localStorage
      const savedEntries = localStorage.getItem("productRegistrations")
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries))
      }
    }

    // Laad andere opgeslagen gegevens
    const savedUsers = localStorage.getItem("customUsers")
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }

    const savedProducts = localStorage.getItem("customProducts")
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    }

    const savedLocations = localStorage.getItem("customLocations")
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations))
    }

    const savedPurposes = localStorage.getItem("customPurposes")
    if (savedPurposes) {
      setPurposes(JSON.parse(savedPurposes))
    }

    setIsLoading(false)
  }

  // Sla gegevens op
  const saveToStorage = async (newEntry: Omit<RegistrationEntry, "id" | "created_at">) => {
    // Probeer eerst Supabase (alleen als geconfigureerd)
    try {
      const { data: supabaseData, error } = await saveRegistration(newEntry)

      if (!error && supabaseData) {
        // Supabase succesvol
        const updatedEntries = [supabaseData, ...entries]
        setEntries(updatedEntries)
        // Sla ook op in localStorage als backup
        localStorage.setItem("productRegistrations", JSON.stringify(updatedEntries))
        return
      }
    } catch (error) {
      console.log("Supabase not available, using localStorage")
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
      photo_url: currentPhoto,
      qr_code: scannedQR,
    }

    await saveToStorage(newEntry)

    // Reset form
    setSelectedProduct("")
    setLocation("")
    setPurpose("")
    setCurrentPhoto("")
    setScannedQR("")

    // Toon success bericht
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
    setIsLoading(false)
  }

  // QR Code handler
  const handleQRScan = (result: string) => {
    setScannedQR(result)
    setShowQRScanner(false)

    // Probeer product info uit QR code te halen
    try {
      const qrData = JSON.parse(result)
      if (qrData.product) setSelectedProduct(qrData.product)
      if (qrData.location) setLocation(qrData.location)
      if (qrData.purpose) setPurpose(qrData.purpose)
    } catch {
      // Als het geen JSON is, gebruik als product naam
      if (products.includes(result)) {
        setSelectedProduct(result)
      }
    }
  }

  // Export naar CSV (gefilterde data)
  const exportToCSV = () => {
    const filteredEntries = getFilteredAndSortedEntries()
    const headers = ["Datum", "Tijd", "Gebruiker", "Product", "Locatie", "Doel", "QR Code", "Foto"]
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
          `"${entry.qr_code || ""}"`,
          `"${entry.photo_url || ""}"`,
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
  const addNewUser = () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const updatedUsers = [...users, newUserName.trim()]
      setUsers(updatedUsers)
      localStorage.setItem("customUsers", JSON.stringify(updatedUsers))
      setNewUserName("")
    }
  }

  // Voeg nieuw product toe
  const addNewProduct = () => {
    if (newProductName.trim() && !products.includes(newProductName.trim())) {
      const updatedProducts = [...products, newProductName.trim()]
      setProducts(updatedProducts)
      localStorage.setItem("customProducts", JSON.stringify(updatedProducts))
      setNewProductName("")
    }
  }

  // Voeg nieuwe locatie toe
  const addNewLocation = () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const updatedLocations = [...locations, newLocationName.trim()]
      setLocations(updatedLocations)
      localStorage.setItem("customLocations", JSON.stringify(updatedLocations))
      setNewLocationName("")
    }
  }

  // Voeg nieuw doel toe
  const addNewPurpose = () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const updatedPurposes = [...purposes, newPurposeName.trim()]
      setPurposes(updatedPurposes)
      localStorage.setItem("customPurposes", JSON.stringify(updatedPurposes))
      setNewPurposeName("")
    }
  }

  // Verwijder item
  const removeUser = (userToRemove: string) => {
    const updatedUsers = users.filter((user) => user !== userToRemove)
    setUsers(updatedUsers)
    localStorage.setItem("customUsers", JSON.stringify(updatedUsers))
  }

  const removeProduct = (productToRemove: string) => {
    const updatedProducts = products.filter((product) => product !== productToRemove)
    setProducts(updatedProducts)
    localStorage.setItem("customProducts", JSON.stringify(updatedProducts))
  }

  const removeLocation = (locationToRemove: string) => {
    const updatedLocations = locations.filter((loc) => loc !== locationToRemove)
    setLocations(updatedLocations)
    localStorage.setItem("customLocations", JSON.stringify(updatedLocations))
  }

  const removePurpose = (purposeToRemove: string) => {
    const updatedPurposes = purposes.filter((p) => p !== purposeToRemove)
    setPurposes(updatedPurposes)
    localStorage.setItem("customPurposes", JSON.stringify(updatedPurposes))
  }

  // Filter en zoek functies
  const getFilteredAndSortedEntries = () => {
    const filtered = entries.filter((entry) => {
      // Zoek in alle velden
      const searchMatch =
        !searchQuery ||
        entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.qr_code && entry.qr_code.toLowerCase().includes(searchQuery.toLowerCase()))

      // Filter op specifieke velden
      const userMatch = !filterUser || filterUser === "all" || entry.user === filterUser
      const productMatch = !filterProduct || entry.product.toLowerCase().includes(filterProduct.toLowerCase())
      const locationMatch = !filterLocation || filterLocation === "all" || entry.location === filterLocation

      // Datum filter
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

    // Sorteren
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/dematic-logo.png" alt="Dematic Logo" className="h-20 w-auto" />
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">Product Registratie</h1>
                <p className="text-sm text-gray-600">Registreer product gebruik en locatie</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span>Powered by Dematic</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Product succesvol geregistreerd!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200">
            <TabsTrigger value="register">Registreren</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis</TabsTrigger>
            <TabsTrigger value="statistics">Statistieken</TabsTrigger>
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="locations">Locaties</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-500" />
                    Nieuw Product Registreren
                  </CardTitle>
                  <CardDescription>Vul onderstaande gegevens in om een product te registreren</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* QR Scanner en Foto Upload knoppen */}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowQRScanner(true)} className="flex-1">
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Scannen
                      </Button>
                    </div>

                    {scannedQR && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>QR Code gescand:</strong> {scannedQR}
                        </p>
                      </div>
                    )}

                    {/* Gebruiker */}
                    <div className="space-y-2">
                      <Label htmlFor="user" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-amber-500" />
                        Gebruiker
                      </Label>
                      <Select value={currentUser} onValueChange={setCurrentUser} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer je naam" />
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

                    {/* Product */}
                    <div className="space-y-2">
                      <Label htmlFor="product" className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-500" />
                        Product
                      </Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Locatie */}
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-500" />
                        Locatie
                      </Label>
                      <Select value={location} onValueChange={setLocation} required>
                        <SelectTrigger>
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

                    {/* Doel */}
                    <div className="space-y-2">
                      <Label htmlFor="purpose" className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        Doel/Toepassing
                      </Label>
                      <Select value={purpose} onValueChange={setPurpose} required>
                        <SelectTrigger>
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

                    <Button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      size="lg"
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Registreren..." : "Registreren"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Foto Upload */}
              <PhotoUpload onPhotoUploaded={setCurrentPhoto} currentPhoto={currentPhoto} />
            </div>
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsDashboard entries={entries} />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-amber-500" />
                      Registratie Geschiedenis
                    </CardTitle>
                    <CardDescription>
                      Overzicht van alle geregistreerde producten ({getFilteredAndSortedEntries().length} van{" "}
                      {entries.length} items)
                    </CardDescription>
                  </div>
                  {entries.length > 0 && (
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Zoek en Filter Sectie */}
                <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Zoeken & Filteren</h3>
                    <Button onClick={clearAllFilters} variant="outline" size="sm">
                      Wis filters
                    </Button>
                  </div>

                  {/* Zoekbalk */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Zoeken</Label>
                    <Input
                      id="search"
                      placeholder="Zoek in alle velden..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Gebruiker Filter */}
                    <div className="space-y-2">
                      <Label>Gebruiker</Label>
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

                    {/* Product Filter */}
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Input
                        placeholder="Zoek product..."
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                      />
                    </div>

                    {/* Locatie Filter */}
                    <div className="space-y-2">
                      <Label>Locatie</Label>
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

                    {/* Sorteren */}
                    <div className="space-y-2">
                      <Label>Sorteren</Label>
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
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Datum Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom">Van datum</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo">Tot datum</Label>
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
                  <div className="space-y-4">
                    {getFilteredAndSortedEntries().map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                {entry.user}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {entry.date} om {entry.time}
                              </span>
                              {entry.qr_code && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  QR
                                </Badge>
                              )}
                              {entry.photo_url && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  📷
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg">{entry.product}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-amber-500" />
                                {entry.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-amber-500" />
                                {entry.purpose}
                              </span>
                            </div>
                            {entry.qr_code && <div className="text-xs text-gray-500">QR: {entry.qr_code}</div>}
                          </div>
                          {entry.photo_url && (
                            <div className="ml-4">
                              <img
                                src={entry.photo_url || "/placeholder.svg"}
                                alt="Registratie foto"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            </div>
                          )}
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
              {/* Nieuwe gebruiker toevoegen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-amber-500" />
                    Nieuwe Gebruiker Toevoegen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Voer gebruikersnaam in"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewUser()}
                    />
                    <Button
                      onClick={addNewUser}
                      disabled={!newUserName.trim()}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gebruikers lijst */}
              <Card>
                <CardHeader>
                  <CardTitle>Gebruikers Beheren ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{user}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
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
              {/* Nieuw product toevoegen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-500" />
                    Nieuw Product Toevoegen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Voer productnaam in"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewProduct()}
                    />
                    <Button
                      onClick={addNewProduct}
                      disabled={!newProductName.trim()}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Producten lijst */}
              <Card>
                <CardHeader>
                  <CardTitle>Producten Beheren ({products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div key={product} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{product}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeProduct(product)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
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
              {/* Nieuwe locatie toevoegen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-500" />
                    Nieuwe Locatie Toevoegen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Voer locatienaam in"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewLocation()}
                    />
                    <Button
                      onClick={addNewLocation}
                      disabled={!newLocationName.trim()}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Locaties lijst */}
              <Card>
                <CardHeader>
                  <CardTitle>Locaties Beheren ({locations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{loc}</span>

                          <span className="font-medium">{loc}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeLocation(loc)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/dematic-logo.png" alt="Dematic Logo" className="h-8 w-auto mr-3" />
              <p className="text-sm text-gray-600">© {new Date().getFullYear()} Dematic. Alle rechten voorbehouden.</p>
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
