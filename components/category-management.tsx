"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import type { ProductCategory } from "@/lib/supabase"

interface CategoryManagementProps {
  categories: ProductCategory[]
  onAddCategory: (category: Omit<ProductCategory, "id" | "created_at">) => void
  onUpdateCategory: (id: string, category: Partial<ProductCategory>) => void
  onDeleteCategory: (id: string) => void
}

const predefinedColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#78716c", // stone
]

const colorNames = ["Rood", "Oranje", "Geel", "Groen", "Cyaan", "Blauw", "Violet", "Roze", "Grijs", "Bruin"]

export function CategoryManagement({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState(predefinedColors[0])

  const resetForm = () => {
    setNewCategoryName("")
    setNewCategoryDescription("")
    setNewCategoryColor(predefinedColors[0])
  }

  const getColorName = (hexColor: string) => {
    const index = predefinedColors.indexOf(hexColor)
    return index !== -1 ? colorNames[index] : "Onbekend"
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsLoading(true)
    try {
      await onAddCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
      })

      resetForm()
      setShowAddDialog(false)
    } catch (error) {
      console.error("Error in handleAddCategory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDescription(category.description || "")
    setNewCategoryColor(category.color || predefinedColors[0])
    setShowEditDialog(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory?.id || !newCategoryName.trim()) return

    setIsLoading(true)
    try {
      await onUpdateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
      })

      resetForm()
      setShowEditDialog(false)
      setEditingCategory(null)
    } catch (error) {
      console.error("Error in handleUpdateCategory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = (category: ProductCategory) => {
    if (!category.id) return

    if (confirm(`Weet je zeker dat je de categorie "${category.name}" wilt verwijderen?`)) {
      onDeleteCategory(category.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Productcategorieën
          </h3>
          <p className="text-sm text-muted-foreground">Organiseer je producten in categorieën</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Categorie
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nog geen categorieën</h3>
            <p className="text-muted-foreground mb-4">Begin met het toevoegen van je eerste productcategorie</p>
            <div className="space-y-2">
              <Button onClick={() => setShowAddDialog(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Eerste Categorie Toevoegen
              </Button>
              <p className="text-xs text-gray-500">Als dit niet werkt, controleer of de database correct is opgezet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead className="hidden md:table-cell">Beschrijving</TableHead>
                <TableHead className="w-[100px]">Kleur</TableHead>
                <TableHead className="w-[120px] text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {category.description || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                        style={{ backgroundColor: category.color }}
                        title={getColorName(category.color || "")}
                      />
                      <span className="text-sm text-gray-600">{getColorName(category.color || "")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        onClick={() => handleEditCategory(category)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Categorie Toevoegen</DialogTitle>
            <DialogDescription>Voeg een nieuwe productcategorie toe om je producten te organiseren.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Naam *</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Bijv. Smeermiddelen"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Beschrijving</Label>
              <Textarea
                id="categoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Optionele beschrijving van de categorie"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Kleur</Label>
              <div className="grid grid-cols-5 gap-3">
                {predefinedColors.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                      newCategoryColor === color ? "border-gray-900 ring-2 ring-gray-300" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                    title={colorNames[index]}
                    disabled={isLoading}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Geselecteerd: {getColorName(newCategoryColor)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={isLoading}>
              Annuleren
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim() || isLoading}>
              {isLoading ? "Bezig..." : "Categorie Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Categorie Bewerken</DialogTitle>
            <DialogDescription>Bewerk de gegevens van de categorie.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Naam *</Label>
              <Input
                id="editCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Bijv. Smeermiddelen"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategoryDescription">Beschrijving</Label>
              <Textarea
                id="editCategoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Optionele beschrijving van de categorie"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Kleur</Label>
              <div className="grid grid-cols-5 gap-3">
                {predefinedColors.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                      newCategoryColor === color ? "border-gray-900 ring-2 ring-gray-300" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                    title={colorNames[index]}
                    disabled={isLoading}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Geselecteerd: {getColorName(newCategoryColor)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
              Annuleren
            </Button>
            <Button onClick={handleUpdateCategory} disabled={!newCategoryName.trim() || isLoading}>
              {isLoading ? "Bezig..." : "Wijzigingen Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
