"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSPromptDismissed, setIsIOSPromptDismissed] = useState(false)

  useEffect(() => {
    // Check voor iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Check of iOS prompt eerder is gesloten
    const iosPromptDismissed = localStorage.getItem("iosInstallPromptDismissed") === "true"
    setIsIOSPromptDismissed(iosPromptDismissed)

    // Luister naar beforeinstallprompt event voor niet-iOS apparaten
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Check of app al is geïnstalleerd
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Toon iOS prompt na 3 seconden als niet eerder gesloten
  useEffect(() => {
    if (isIOS && !isIOSPromptDismissed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isIOS, isIOSPromptDismissed])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    if (isIOS) {
      localStorage.setItem("iosInstallPromptDismissed", "true")
    } else {
      localStorage.setItem("installPromptDismissed", "true")
    }
  }

  if (!showInstallPrompt) return null

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-amber-200 bg-amber-50 md:left-auto md:right-4 md:w-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-amber-900">App Installeren</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-amber-700 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-amber-800">
          {isIOS
            ? "Installeer deze app op je iOS apparaat voor snellere toegang"
            : "Installeer de app voor snellere toegang en offline gebruik"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isIOS ? (
          <div className="space-y-3">
            <div className="rounded-md bg-amber-100 p-3 text-sm text-amber-800">
              <ol className="list-decimal pl-4 space-y-2">
                <li>
                  Tik op{" "}
                  <span className="inline-flex items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" />
                    </svg>{" "}
                    Deel
                  </span>{" "}
                  onderaan
                </li>
                <li>
                  Scroll omlaag en tik op <span className="font-medium">Zet op beginscherm</span>
                </li>
              </ol>
            </div>
            <div className="flex justify-center">
              <Smartphone className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        ) : (
          <Button onClick={handleInstall} className="w-full bg-amber-500 hover:bg-amber-600 text-white" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Installeer App
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
