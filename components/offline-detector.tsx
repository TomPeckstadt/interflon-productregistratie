"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    // Controleer initiële online status
    setIsOffline(!navigator.onLine)

    // Event listeners voor online/offline status
    const handleOnline = () => {
      setIsOffline(false)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowAlert(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showAlert) return null

  return (
    <Alert
      className={`fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96 ${
        isOffline ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
      }`}
      variant="default"
    >
      {isOffline ? <WifiOff className="h-4 w-4 text-red-600" /> : <Wifi className="h-4 w-4 text-green-600" />}
      <AlertTitle className={isOffline ? "text-red-800" : "text-green-800"}>
        {isOffline ? "Je bent offline" : "Je bent weer online"}
      </AlertTitle>
      <AlertDescription className={isOffline ? "text-red-700" : "text-green-700"}>
        {isOffline
          ? "Sommige functies zijn mogelijk beperkt. Eerder geladen gegevens blijven beschikbaar."
          : "Alle functies zijn nu beschikbaar."}
      </AlertDescription>
    </Alert>
  )
}
