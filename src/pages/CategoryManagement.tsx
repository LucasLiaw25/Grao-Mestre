// src/pages/CategoryManagement.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Loader2, Tag } from "lucide-react"; // Tag icon for categories
import { categoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { CategoryRequestDTO, CategoryResponseDTO } from "@/types";
import { cn } from "@/lib/utils"; // For conditional classes

export default function CategoryManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDTO | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryRequestDTO>({
    name: "",
    description: "",
  });

  // Fetch Categories
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  // Mutations
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

  // --- Form Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (category: CategoryResponseDTO) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "", // Ensure description is not undefined
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-destructive mb-4">Error loading data</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-12"
        >
          <h1 className="font-serif text-4xl font-bold text-foreground">Category Management</h1>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-5 h-5" />
            Add New Category
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden"
        >
          {categories && categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {categories.map((category) => (
                    <motion.tr
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {category.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(category)}
                            disabled={updateCategoryMutation.isPending}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                            disabled={deleteCategoryMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            {deleteCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Tag className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl font-serif">No categories found. Start by adding a new one!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Category Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-foreground">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingCategory ? "Make changes to the category here." : "Fill in the details to add a new category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={categoryForm.name}
                onChange={handleInputChange}
                className="col-span-3 bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={categoryForm.description || ""} // Ensure it's a controlled component
                onChange={handleInputChange}
                className="col-span-3 bg-background border-border text-foreground min-h-[100px]"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={closeFormModal} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
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