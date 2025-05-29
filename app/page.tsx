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
import { User, Package, MapPin, Save, History, CheckCircle, Download, UserPlus, Trash2, Target } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

// Standaard gegevens
const DEFAULT_USERS = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const DEFAULT_PRODUCTS = ["Laptop Dell XPS", 'Monitor Samsung 24"', "Muis Logitech", "Toetsenbord Mechanical"]
const DEFAULT_LOCATIONS = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
const DEFAULT_PURPOSES = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]

export default function ProductRegistrationApp() {
  const [currentUser, setCurrentUser] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
  const [entries, setEntries] = useState<RegistrationEntry[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

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

  // Laad opgeslagen gegevens
  useEffect(() => {
    const savedEntries = localStorage.getItem("productRegistrations")
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }

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
  }, [])

  // Sla gegevens op
  const saveToStorage = (newEntries: RegistrationEntry[]) => {
    localStorage.setItem("productRegistrations", JSON.stringify(newEntries))
    setEntries(newEntries)
  }

  // Registreer nieuw item
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

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
    saveToStorage(updatedEntries)

    // Reset form
    setSelectedProduct("")
    setLocation("")
    setPurpose("")

    // Toon success bericht
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  // Export naar CSV
  const exportToCSV = () => {
    const headers = ["Datum", "Tijd", "Gebruiker", "Product", "Locatie", "Doel"]
    const csvContent = [
      headers.join(","),
      ...entries.map((entry) =>
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
    link.setAttribute("download", `product-registraties-${new Date().toISOString().split("T")[0]}.csv`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Registratie</h1>
            <p className="text-gray-600">Registreer product gebruik en locatie</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Product succesvol geregistreerd!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
            <TabsTrigger value="register">Registreren</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis</TabsTrigger>
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="locations">Locaties</TabsTrigger>
          </TabsList>
          <TabsContent value="register">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Nieuw Product Registreren
                </CardTitle>
                <CardDescription>Vul onderstaande gegevens in om een product te registreren</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Gebruiker */}
                  <div className="space-y-2">
                    <Label htmlFor="user" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
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
                      <Package className="h-4 w-4 text-blue-500" />
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
                      <MapPin className="h-4 w-4 text-blue-500" />
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
                      <Target className="h-4 w-4 text-blue-500" />
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

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    Registreren
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
                      <History className="h-5 w-5 text-blue-500" />
                      Registratie Geschiedenis
                    </CardTitle>
                    <CardDescription>
                      Overzicht van alle geregistreerde producten ({entries.length} items)
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
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nog geen registraties. Begin met het registreren van een product!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {entry.user}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {entry.date} om {entry.time}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg">{entry.product}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-blue-500" />
                                {entry.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-blue-500" />
                                {entry.purpose}
                              </span>
                            </div>
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
              {/* Nieuwe gebruiker toevoegen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-500" />
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
                    <Button onClick={addNewUser} disabled={!newUserName.trim()}>
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
                    <Package className="h-5 w-5 text-blue-500" />
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
                    <Button onClick={addNewProduct} disabled={!newProductName.trim()}>
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
                    <MapPin className="h-5 w-5 text-blue-500" />
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
                    <Button onClick={addNewLocation} disabled={!newLocationName.trim()}>
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
                          <MapPin className="h-4 w-4 text-blue-500" />
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
    </div>
  )
}
