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

// Standaard gegevens
const DEFAULT_USERS = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const DEFAULT_PRODUCTS = ["Laptop Dell XPS", "Monitor Samsung 24", "Muis Logitech", "Toetsenbord Mechanical"]
const DEFAULT_LOCATIONS = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
const DEFAULT_PURPOSES = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]

interface RegistrationEntry {
  id: string
  user: string
  product: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
}

export default function ProductRegistrationApp() {
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[0])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
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

  // Import states
  const [importMessage, setImportMessage] = useState("")
  const [importError, setImportError] = useState("")
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

  // Laad opgeslagen gegevens bij start
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Laad registraties
    const savedEntries = localStorage.getItem("productRegistrations")
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }

    // Laad aangepaste lijsten
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
  }

  // Excel import functie
  const handleFileImport = async (file: File, type: "users" | "products" | "locations" | "purposes") => {
    try {
      setImportError("")
      setImportMessage("Bestand wordt verwerkt...")

      const text = await file.text()
      let items: string[] = []

      if (file.name.endsWith(".csv")) {
        // CSV verwerking
        const lines = text.split("\n").filter((line) => line.trim())
        items = lines
          .map((line) => {
            // Verwijder quotes en komma's, neem eerste kolom
            const cleaned = line.split(",")[0].replace(/"/g, "").trim()
            return cleaned
          })
          .filter((item) => item && item.length > 0)
      } else {
        // Probeer als tekst bestand (elke regel is een item)
        items = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && line.length > 0)
      }

      if (items.length === 0) {
        setImportError("Geen geldige items gevonden in het bestand")
        return
      }

      // Update de juiste lijst
      let currentList: string[] = []
      let setList: (items: string[]) => void
      let storageKey: string

      switch (type) {
        case "users":
          currentList = users
          setList = setUsers
          storageKey = "customUsers"
          break
        case "products":
          currentList = products
          setList = setProducts
          storageKey = "customProducts"
          break
        case "locations":
          currentList = locations
          setList = setLocations
          storageKey = "customLocations"
          break
        case "purposes":
          currentList = purposes
          setList = setPurposes
          storageKey = "customPurposes"
          break
      }

      // Voeg nieuwe items toe (vermijd duplicaten)
      const newItems = items.filter((item) => !currentList.includes(item))
      const updatedList = [...currentList, ...newItems]

      setList(updatedList)
      localStorage.setItem(storageKey, JSON.stringify(updatedList))

      setImportMessage(
        `✅ ${newItems.length} nieuwe ${type} geïmporteerd! (${items.length - newItems.length} duplicaten overgeslagen)`,
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
          "Laptop Dell XPS",
          "Monitor Samsung 24",
          "Muis Logitech",
          "Toetsenbord Mechanical",
          "Nieuw Product",
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

    setIsLoading(true)

    const now = new Date()
    const newEntry: RegistrationEntry = {
      id: Date.now().toString(),
      user: currentUser,
      product: selectedProduct,
      location,
      purpose,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("nl-NL"),
      time: now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
    }

    const updatedEntries = [newEntry, ...entries]
    setEntries(updatedEntries)
    localStorage.setItem("productRegistrations", JSON.stringify(updatedEntries))

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

    const filterSuffix =
      searchQuery || filterUser !== "all" || filterProduct || filterLocation !== "all" ? "-gefilterd" : ""
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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Systeem actief</span>
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
                <CardDescription>Vul onderstaande gegevens in om een product te registreren</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">👤 Gebruiker</Label>
                      <Select value={currentUser} onValueChange={setCurrentUser} required>
                        <SelectTrigger className="h-12">
                          <SelectValue />
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
                      <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                        <SelectTrigger className="h-12">
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

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 h-14 text-lg font-medium"
                    disabled={isLoading}
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
                      {entries.length} items)
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
                      placeholder="Zoek in alle velden..."
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
                        disabled={!newUserName.trim()}
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
                  <CardDescription>Voeg handmatig producten toe of importeer vanuit een bestand</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Handmatig toevoegen */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">Handmatig toevoegen</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Voer productnaam in"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addNewProduct()}
                        className="h-12"
                      />
                      <Button
                        onClick={addNewProduct}
                        disabled={!newProductName.trim()}
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
                          ref={productFileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileImport(file, "products")
                          }}
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ondersteunde formaten: CSV, TXT (één product per regel)
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button onClick={() => exportTemplate("products")} variant="outline" className="h-12">
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
                  <CardTitle>Producten Lijst ({products.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div key={product} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <span className="font-medium">📦 {product}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeProduct(product)}
                          className="text-red-600 hover:text-red-700"
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
                        disabled={!newLocationName.trim()}
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
                        disabled={!newPurposeName.trim()}
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
