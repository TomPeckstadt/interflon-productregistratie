"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProductRegistrationApp() {
  const [currentUser, setCurrentUser] = useState("Jan Janssen")
  const [selectedProduct, setSelectedProduct] = useState("Laptop Dell XPS")
  const [location, setLocation] = useState("Kantoor 1.1")
  const [purpose, setPurpose] = useState("Presentatie")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Product geregistreerd!")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Product Registratie</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Nieuw Product Registreren</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Gebruiker</Label>
                <Select value={currentUser} onValueChange={setCurrentUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jan Janssen">Jan Janssen</SelectItem>
                    <SelectItem value="Marie Pietersen">Marie Pietersen</SelectItem>
                    <SelectItem value="Piet de Vries">Piet de Vries</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laptop Dell XPS">Laptop Dell XPS</SelectItem>
                    <SelectItem value="Monitor Samsung 24">Monitor Samsung 24</SelectItem>
                    <SelectItem value="Muis Logitech">Muis Logitech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Locatie</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kantoor 1.1">Kantoor 1.1</SelectItem>
                    <SelectItem value="Kantoor 1.2">Kantoor 1.2</SelectItem>
                    <SelectItem value="Vergaderzaal A">Vergaderzaal A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Doel</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Presentatie">Presentatie</SelectItem>
                    <SelectItem value="Thuiswerken">Thuiswerken</SelectItem>
                    <SelectItem value="Reparatie">Reparatie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Registreren
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
