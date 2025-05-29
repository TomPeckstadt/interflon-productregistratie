"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download } from "lucide-react"

interface ExcelImporterProps {
  title: string
  description: string
  onImport: (items: string[]) => void
  existingItems: string[]
  type: "users" | "products" | "locations" | "purposes"
}

export function ExcelImporter({ title, description, onImport, existingItems, type }: ExcelImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    newItems: string[]
    duplicates: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setImportResult(null)

    try {
      const text = await file.text()
      let items: string[] = []

      if (file.name.endsWith(".csv")) {
        // CSV verwerking
        const lines = text.split("\n")
        items = lines.map((line) => line.trim().replace(/"/g, "")).filter((line) => line.length > 0)
      } else if (file.name.endsWith(".txt")) {
        // TXT verwerking (één item per regel)
        items = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      } else {
        throw new Error("Alleen CSV en TXT bestanden worden ondersteund")
      }

      // Verwijder lege items en duplicaten binnen de import
      const cleanItems = [...new Set(items.filter((item) => item.trim().length > 0))]

      // Check voor duplicaten met bestaande items
      const newItems = cleanItems.filter((item) => !existingItems.includes(item))
      const duplicates = cleanItems.filter((item) => existingItems.includes(item))

      if (newItems.length > 0) {
        onImport(newItems)
        setImportResult({
          success: true,
          message: `${newItems.length} nieuwe items geïmporteerd`,
          newItems,
          duplicates,
        })
      } else {
        setImportResult({
          success: false,
          message: "Geen nieuwe items gevonden om te importeren",
          newItems: [],
          duplicates,
        })
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `Fout bij importeren: ${error instanceof Error ? error.message : "Onbekende fout"}`,
        newItems: [],
        duplicates: [],
      })
    } finally {
      setIsProcessing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const downloadTemplate = () => {
    let templateContent = ""
    let filename = ""

    switch (type) {
      case "users":
        templateContent = "Jan Janssen\nMarie Pietersen\nPiet de Vries\nAnna van der Berg\nTom Bakker"
        filename = "gebruikers-template.csv"
        break
      case "products":
        templateContent = 'Laptop Dell XPS\nMonitor Samsung 24"\nMuis Logitech\nToetsenbord Mechanical\nWebcam HD'
        filename = "producten-template.csv"
        break
      case "locations":
        templateContent = "Kantoor 1.1\nKantoor 1.2\nVergaderzaal A\nWarehouse\nThuis"
        filename = "locaties-template.csv"
        break
      case "purposes":
        templateContent = "Presentatie\nThuiswerken\nReparatie\nTraining\nDemonstratie"
        filename = "doelen-template.csv"
        break
    }

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-amber-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Verwerken..." : "Bestand Kiezen"}
          </Button>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Ondersteunde formaten:</strong> CSV, TXT
          </p>
          <p>
            <strong>Format:</strong> Één item per regel
          </p>
          <p>
            <strong>Tip:</strong> Download eerst de template voor het juiste format
          </p>
        </div>

        {importResult && (
          <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
              <div className="space-y-2">
                <p>{importResult.message}</p>
                {importResult.newItems.length > 0 && (
                  <div>
                    <p className="font-medium">Nieuwe items:</p>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.newItems.slice(0, 5).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                      {importResult.newItems.length > 5 && <li>... en {importResult.newItems.length - 5} meer</li>}
                    </ul>
                  </div>
                )}
                {importResult.duplicates.length > 0 && (
                  <div>
                    <p className="font-medium">Overgeslagen (bestaan al):</p>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.duplicates.slice(0, 3).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                      {importResult.duplicates.length > 3 && <li>... en {importResult.duplicates.length - 3} meer</li>}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileSelect} className="hidden" />
      </CardContent>
    </Card>
  )
}
