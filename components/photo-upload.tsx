"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, X } from "lucide-react"
import { uploadPhoto } from "@/lib/firebase"

interface PhotoUploadProps {
  onPhotoUploaded: (url: string) => void
  currentPhoto?: string
}

export function PhotoUpload({ onPhotoUploaded, currentPhoto }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string>(currentPhoto || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Toon preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      // Gebruik lokale preview als fallback
      onPhotoUploaded(result)
    }
    reader.readAsDataURL(file)

    // Probeer upload naar Firebase (als beschikbaar)
    setIsUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { url, error } = await uploadPhoto(file, fileName)

      if (url && !error) {
        // Firebase upload succesvol - gebruik de URL
        onPhotoUploaded(url)
        setPreview(url)
      }
      // Als Firebase niet beschikbaar is, blijft de lokale preview actief
    } catch (error) {
      console.error("Upload error:", error)
      // Lokale preview blijft actief
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removePhoto = () => {
    setPreview("")
    onPhotoUploaded("")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-amber-500" />
          Foto Toevoegen
        </CardTitle>
        <CardDescription>Voeg een foto toe aan deze registratie (optioneel)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removePhoto}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Andere Foto Kiezen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              {isUploading ? "Uploaden..." : "Foto Maken"}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bestand Kiezen
            </Button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
