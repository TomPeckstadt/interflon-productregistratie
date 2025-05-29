"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Interface
interface RegistrationEntry {
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
}

// Standaard gegevens
const DEFAULT_USERS = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const DEFAULT_PRODUCTS = ["Laptop Dell XPS", "Monitor Samsung 24", "Muis Logitech", "Toetsenbord Mechanical"]
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

  const loadData = () => {
    setIsLoading(true)

    // Laad registraties
    const savedEntries = localStorage.getItem("productRegistrations")
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }

    // Laad gebruikers
    const savedUsers = localStorage.getItem("customUsers")
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }

    // Laad producten
    const savedProducts = localStorage.getItem("customProducts")
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    }

    // Laad locaties
    const savedLocations = localStorage.getItem("customLocations")
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations))
    }

    // Laad doelen
    const savedPurposes = localStorage.getItem("customPurposes")
    if (savedPurposes) {
      setPurposes(JSON.parse(savedPurposes))
    }

    setIsLoading(false)
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
      photo_url: "",
      qr_code: "",
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-3xl text-white">📦</span>
              </div>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">Product Registratie</h1>
                <p className="text-sm text-gray-600">Registreer product gebruik en locatie</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span>Powered by Interflon</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ Product succesvol geregistreerd!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200">
            <TabsTrigger value="register">Registreren</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis</TabsTrigger>
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="locations">Locaties</TabsTrigger>
            <TabsTrigger value="purposes">Doelen</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📦</span>
                  Nieuw Product Registreren
                </CardTitle>
                <CardDescription>Vul onderstaande gegevens in om een product te registreren</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Gebruiker */}
                  <div className="space-y-2">
                    <Label htmlFor="user" className="flex items-center gap-2">
                      <span>👤</span>
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
                      <span>📦</span>
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
                      <span>📍</span>
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
                      <span>🎯</span>
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
                    <span className="mr-2">💾</span>
                    {isLoading ? "Registreren..." : "Registreren"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>📋</span>
                      Registratie Geschiedenis
                    </CardTitle>
                    <CardDescription>
                      Overzicht van alle geregistreerde producten ({getFilteredAndSortedEntries().length} van{" "}
                      {entries.length} items)
                    </CardDescription>
                  </div>
                  {entries.length > 0 && (
                    <Button onClick={exportToCSV} variant="outline">
                      <span className="mr-2">⬇️</span>
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
                      <Label>Gebruiker</Label>
                      <Select value={filterUser} onValueChange={setFilterUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle gebruikers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle gebruikers</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={
