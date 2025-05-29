"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Eenvoudige interface
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

  // Laad opgeslagen gegevens bij start
  useEffect(() => {
    const savedEntries = localStorage.getItem("productRegistrations")
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }
  }, [])

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
    setEntries(updatedEntries)
    localStorage.setItem("productRegistrations", JSON.stringify(updatedEntries))

    // Reset form
    setSelectedProduct(DEFAULT_PRODUCTS[0])
    setLocation(DEFAULT_LOCATIONS[0])
    setPurpose(DEFAULT_PURPOSES[0])

    // Toon success bericht
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      <div className="container mx-auto px-4 py-8">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ Product succesvol geregistreerd!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registratie Formulier */}
          <Card>
            <CardHeader>
              <CardTitle>Nieuw Product Registreren</CardTitle>
              <CardDescription>Vul onderstaande gegevens in om een product te registreren</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Gebruiker */}
                <div className="space-y-2">
                  <Label htmlFor="user">Gebruiker</Label>
                  <Select value={currentUser} onValueChange={setCurrentUser} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer je naam" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_USERS.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product */}
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een product" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_PRODUCTS.map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Locatie */}
                <div className="space-y-2">
                  <Label htmlFor="location">Locatie</Label>
                  <Select value={location} onValueChange={setLocation} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een locatie" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Doel */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Doel/Toepassing</Label>
                  <Select value={purpose} onValueChange={setPurpose} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een doel" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_PURPOSES.map((purposeItem) => (
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

          {/* Geschiedenis */}
          <Card>
            <CardHeader>
              <CardTitle>Recente Registraties</CardTitle>
              <CardDescription>Overzicht van de laatste {entries.length} registraties</CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nog geen registraties. Begin met het registreren van een product!
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-amber-700">{entry.user}</span>
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
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Interflon. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  )
}
