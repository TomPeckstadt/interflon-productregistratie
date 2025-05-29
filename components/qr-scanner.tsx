"use client"

import { useState, useEffect, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, X, CheckCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedResult, setScannedResult] = useState<string>("")
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false,
      )

      scanner.render(
        (decodedText) => {
          setScannedResult(decodedText)
          setIsScanning(false)
          scanner.clear()
          onScan(decodedText)
        },
        (error) => {
          console.warn("QR scan error:", error)
        },
      )

      scannerRef.current = scanner

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear()
        }
      }
    }
  }, [isScanning, onScan])

  const startScanning = () => {
    setIsScanning(true)
    setScannedResult("")
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (scannerRef.current) {
      scannerRef.current.clear()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-amber-500" />
            QR Code Scanner
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Scan een QR code om product informatie automatisch in te vullen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !scannedResult && (
          <Button onClick={startScanning} className="w-full bg-amber-600 hover:bg-amber-700">
            <QrCode className="h-4 w-4 mr-2" />
            Start Scannen
          </Button>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full"></div>
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Stop Scannen
            </Button>
          </div>
        )}

        {scannedResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">QR Code gescand!</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 break-all">{scannedResult}</p>
            </div>
            <Button onClick={startScanning} variant="outline" className="w-full">
              Scan Opnieuw
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
