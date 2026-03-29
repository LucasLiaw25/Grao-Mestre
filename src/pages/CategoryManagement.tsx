// src/pages/CategoryManagement.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Tag, 
  AlertCircle 
} from "lucide-react";
import { categoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import type { CategoryRequestDTO, CategoryResponseDTO } from "@/types";
import { cn } from "@/lib/utils";

export default function CategoryManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDTO | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryRequestDTO>({
    name: "",
    description: "",
  });

  // ── Fetch Categories ─────────────────────────────────────────────────────────
  const { 
    data: categories, 
    isLoading: isLoadingCategories, 
    error: categoriesError 
  } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createCategoryMutation = useMutation({
    mutationFn: (newCategory: CategoryRequestDTO) => categoriesApi.create(newCategory),
    onSuccess: () => {
      toast({ title: "Success", description: "Category created successfully." });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeFormModal();
    },
    onError: (err) => {
      console.error("Error creating category:", err);
      toast({ title: "Error", description: "Failed to create category. Please try again.", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (updatedCategory: { id: number; data: CategoryRequestDTO }) =>
      categoriesApi.update(updatedCategory.id, updatedCategory.data),
    onSuccess: () => {
      toast({ title: "Success", description: "Category updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeFormModal();
    },
    onError: (err) => {
      console.error("Error updating category:", err);
      toast({ title: "Error", description: "Failed to update category. Please try again.", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Category deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      console.error("Error deleting category:", err);
      toast({ title: "Error", description: "Failed to delete category. Please try again.", variant: "destructive" });
    },
  });

  // ── Form Handlers ────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
    setIsFormModalOpen(true);
  };

  const openEditModal = (category: CategoryResponseDTO) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  // ── Loading / Error States ───────────────────────────────────────────────────
  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
          <p className="text-stone-500 text-sm font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-xl font-serif font-bold text-red-700">Error loading data</h1>
          <p className="text-stone-500 text-sm">Please try again later.</p>
        </div>
      </div>
    );
  }

  const totalCategories = categories?.length || 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-24 pb-24 overflow-x-hidden">
      <div className="w-full max-w-[95vw] sm:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground tracking-tight">
              Category Management
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {totalCategories > 0
                ? `${totalCategories} categories found`
                : "No categories registered yet"}
            </p>
          </div>
          <Button onClick={openCreateModal} className="gap-2 bg-stone-800 hover:bg-stone-700 text-amber-50">
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        </motion.div>

        {/* ── Table / Empty State ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
        >
          {categories && categories.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-stone-50/80 text-left">
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Name
                      </th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-stone-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {categories.map((category) => (
                      <motion.tr
                        key={category.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-stone-700 text-sm">
                            {category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 max-w-md truncate">
                          {category.description || "No description provided"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(category)}
                              disabled={updateCategoryMutation.isPending}
                              className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCategoryMutation.mutate(category.id)}
                              disabled={deleteCategoryMutation.isPending}
                              className="p-2 rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              {deleteCategoryMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="sm:hidden divide-y divide-border/50">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 space-y-3">
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {category.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {category.description || "No description provided"}
                      </p>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-stone-100 gap-1.5">
                      <button
                        onClick={() => openEditModal(category)}
                        disabled={updateCategoryMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {deleteCategoryMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3 text-stone-400">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
                  <Tag className="w-6 h-6 opacity-50" />
                </div>
                <p className="font-serif text-lg font-semibold text-stone-500">
                  No categories found
                </p>
                <p className="text-xs">
                  Start by adding a new category to organize your products.
                </p>
                <Button 
                  variant="link" 
                  onClick={openCreateModal}
                  className="mt-1 text-xs font-bold text-stone-600 underline underline-offset-2 hover:text-stone-900"
                >
                  Create your first category
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Category Form Modal ─────────────────────────────────────────────── */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-foreground rounded-2xl p-6 border-border/60 shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-foreground tracking-tight">
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-sm">
              {editingCategory 
                ? "Make changes to the category details below." 
                : "Fill in the details to add a new category to your store."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase text-stone-500">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={categoryForm.name}
                onChange={handleInputChange}
                placeholder="e.g. Electronics"
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase text-stone-500">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={categoryForm.description || ""}
                onChange={handleInputChange}
                placeholder="Brief description of this category..."
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300 min-h-[100px] resize-none"
              />
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={closeFormModal} 
                type="button"
                className="rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-50"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingCategory ? (
                  "Save Changes"
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}