"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Users, Package, MapPin, Calendar } from "lucide-react"

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

interface StatisticsDashboardProps {
  entries: RegistrationEntry[]
}

const COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#f97316"]

export function StatisticsDashboard({ entries }: StatisticsDashboardProps) {
  const stats = useMemo(() => {
    // Basis statistieken
    const totalRegistrations = entries.length
    const uniqueUsers = new Set(entries.map((e) => e.user)).size
    const uniqueProducts = new Set(entries.map((e) => e.product)).size
    const uniqueLocations = new Set(entries.map((e) => e.location)).size

    // Registraties per gebruiker
    const userStats = entries.reduce(
      (acc, entry) => {
        acc[entry.user] = (acc[entry.user] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const userChartData = Object.entries(userStats)
      .map(([user, count]) => ({ name: user, value: count }))
      .sort((a, b) => b.value - a.value)

    // Registraties per product
    const productStats = entries.reduce(
      (acc, entry) => {
        acc[entry.product] = (acc[entry.product] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const productChartData = Object.entries(productStats)
      .map(([product, count]) => ({ name: product, value: count }))
      .sort((a, b) => b.value - a.value)

    // Registraties per locatie
    const locationStats = entries.reduce(
      (acc, entry) => {
        acc[entry.location] = (acc[entry.location] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const locationChartData = Object.entries(locationStats)
      .map(([location, count]) => ({ name: location, value: count }))
      .sort((a, b) => b.value - a.value)

    // Registraties per dag (laatste 7 dagen)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toLocaleDateString("nl-NL")
    }).reverse()

    const dailyStats = last7Days.map((date) => {
      const count = entries.filter((entry) => entry.date === date).length
      return { date, count }
    })

    // Meest actieve gebruiker
    const mostActiveUser = Object.entries(userStats).sort(([, a], [, b]) => b - a)[0]

    // Meest gebruikte product
    const mostUsedProduct = Object.entries(productStats).sort(([, a], [, b]) => b - a)[0]

    return {
      totalRegistrations,
      uniqueUsers,
      uniqueProducts,
      uniqueLocations,
      userChartData,
      productChartData,
      locationChartData,
      dailyStats,
      mostActiveUser,
      mostUsedProduct,
    }
  }, [entries])

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Statistieken Dashboard
          </CardTitle>
          <CardDescription>
            Nog geen data beschikbaar. Begin met het registreren van producten om statistieken te zien.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overzicht Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Registraties</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Alle product registraties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Unieke gebruikers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verschillende Producten</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">Geregistreerde producten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locaties</CardTitle>
            <MapPin className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueLocations}</div>
            <p className="text-xs text-muted-foreground">Verschillende locaties</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafieken */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registraties per dag */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              Registraties Laatste 7 Dagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top gebruikers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Registraties per Gebruiker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.userChartData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product verdeling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              Product Verdeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.productChartData.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.productChartData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Locatie verdeling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              Registraties per Locatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.locationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {stats.mostActiveUser && stats.mostUsedProduct && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                <span className="text-sm">
                  <strong>{stats.mostActiveUser[0]}</strong> is de meest actieve gebruiker met{" "}
                  <strong>{stats.mostActiveUser[1]}</strong> registraties
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-500" />
                <span className="text-sm">
                  <strong>{stats.mostUsedProduct[0]}</strong> is het meest geregistreerde product met{" "}
                  <strong>{stats.mostUsedProduct[1]}</strong> registraties
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Aanbevelingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                {stats.uniqueUsers < 5 && <p>• Voeg meer gebruikers toe om betere statistieken te krijgen</p>}
                {stats.totalRegistrations < 10 && <p>• Registreer meer producten voor uitgebreidere analyses</p>}
                {stats.uniqueLocations < 3 && <p>• Voeg meer locaties toe voor betere tracking</p>}
                <p>• Gebruik de export functie voor rapportage</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
