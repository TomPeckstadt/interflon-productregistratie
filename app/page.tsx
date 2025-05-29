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

  const [users, setUsers] = useState<string[]>(DEFAULT_USERS)
  const [products, setProducts] = useState<string[]>(DEFAULT_PRODUCTS)
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS)
  const [purposes, setPurposes] = useState<string[]>(DEFAULT_PURPOSES)

  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")

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
    setEntries(updatedEntries)
    localStorage.setItem("productRegistrations", JSON.stringify(updatedEntries))

    setSelectedProduct("")
    setLocation("")
    setPurpose("")

    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const addNewUser = () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const updatedUsers = [...users, newUserName.trim()]
      setUsers(updatedUsers)
      localStorage.setItem("customUsers", JSON.stringify(updatedUsers))
      setNewUserName("")
    }
  }

  const addNewProduct = () => {
    if (newProductName.trim() && !products.includes(newProductName.trim())) {
      const updatedProducts = [...products, newProductName.trim()]
      setProducts(updatedProducts)
      localStorage.setItem("customProducts", JSON.stringify(updatedProducts))
      setNewProductName("")
    }
  }

  const addNewLocation = () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const updatedLocations = [...locations, newLocationName.trim()]
      setLocations(updatedLocations)
      localStorage.setItem("customLocations", JSON.stringify(updatedLocations))
      setNewLocationName("")
    }
  }

  const addNewPurpose = () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const updatedPurposes = [...purposes, newPurposeName.trim()]
      setPurposes(updatedPurposes)
      localStorage.setItem("customPurposes", JSON.stringify(updatedPurposes))
      setNewPurposeName("")
    }
  }

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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">📦</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Registratie</h1>
              <p className="text-sm text-gray-600">Registreer product gebruik en locatie</p>
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
                <CardTitle>📦 Nieuw Product Registreren</CardTitle>
                <CardDescription>Vul onderstaande gegevens in om een product te registreren</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>👤 Gebruiker</Label>
                    <Select value={currentUser} onValueChange={setCurrentUser} required>
                      <SelectTrigger>
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
                    <Label>📦 Product</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>📍 Locatie</Label>
                    <Select value={location} onValueChange={setLocation} required>
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>🎯 Doel</Label>
                    <Select value={purpose} onValueChange={setPurpose} required>
                      <SelectTrigger>
                        <SelectValue />
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

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                    💾 Registreren
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>📋 Registratie Geschiedenis</CardTitle>
                <CardDescription>Overzicht van alle geregistreerde producten ({entries.length} items)</CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nog geen registraties. Begin met het registreren van een product!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.slice(0, 20).map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {entry.user}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {entry.date} om {entry.time}
                          </span>
                        </div>
                        <h4 className="font-semibold">{entry.product}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          📍 {entry.location} • 🎯 {entry.purpose}
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
              <Card>
                <CardHeader>
                  <CardTitle>👤➕ Nieuwe Gebruiker Toevoegen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Voer gebruikersnaam in"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewUser()}
                    />
                    <Button onClick={addNewUser} disabled={!newUserName.trim()} className="bg-amber-600 hover:bg-amber-700">
                      Toevoegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
              <Card>
                <CardHeader>
                  <CardTitle>📦 Nieuw Product Toevoegen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Voer productnaam in"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewProduct()}
                    />
                    <Button onClick={addNewProduct} disabled={!newProductName.trim()} className="bg-amber-600 hover:bg-amber-700">
                      Toevoegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
