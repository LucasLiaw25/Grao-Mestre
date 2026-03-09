// src/pages/ProductManagement.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, ImagePlus } from "lucide-react";
import { productsApi, categoriesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast"; // Assumindo que este hook existe
import { Button } from "@/components/ui/button"; // Assumindo que este componente existe
import { Input } from "@/components/ui/input"; // Assumindo que este componente existe
import { Textarea } from "@/components/ui/textarea"; // Assumindo que este componente existe
import { Label } from "@/components/ui/label"; // Assumindo que este componente existe
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assumindo que este componente existe
import { Switch } from "@/components/ui/switch"; // Assumindo que este componente existe
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Assumindo que este componente existe
import type { ProductRequestDTO, ProductResponseDTO, CategoryResponseDTO } from "@/types";
import { cn } from "@/lib/utils"; // Para classes condicionais

export default function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponseDTO | null>(null);
  const [productForm, setProductForm] = useState<ProductRequestDTO>({
    name: "",
    description: "",
    storage: 0,
    price: 0,
    active: true,
    categoryId: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch Products
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  // Fetch Categories
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (newProduct: { product: ProductRequestDTO; imageFile?: File }) =>
      productsApi.create(newProduct.product, newProduct.imageFile),
    onSuccess: () => {
      toast({ title: "Success", description: "Product created successfully." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeFormModal();
    },
    onError: (err) => {
      console.error("Error creating product:", err);
      toast({ title: "Error", description: "Failed to create product. Please try again.", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (updatedProduct: { id: number; product: ProductRequestDTO; imageFile?: File }) =>
      productsApi.update(updatedProduct.id, updatedProduct.product, updatedProduct.imageFile),
    onSuccess: () => {
      toast({ title: "Success", description: "Product updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeFormModal();
    },
    onError: (err) => {
      console.error("Error updating product:", err);
      toast({ title: "Error", description: "Failed to update product. Please try again.", variant: "destructive" });
    },
  });

  const deactivateProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.deactivate(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Product deactivated successfully." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      console.error("Error deactivating product:", err);
      toast({ title: "Error", description: "Failed to deactivate product. Please try again.", variant: "destructive" });
    },
  });

  const activateProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.activate(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Product activated successfully." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      console.error("Error activating product:", err);
      toast({ title: "Error", description: "Failed to activate product. Please try again.", variant: "destructive" });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setProductForm((prev) => ({
      ...prev,
      categoryId: parseInt(value),
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setProductForm((prev) => ({
      ...prev,
      active: checked,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      storage: 0,
      price: 0,
      active: true,
      categoryId: categories?.[0]?.id || 0, // Pre-select first category if available
    });
    setImageFile(null);
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: ProductResponseDTO) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      storage: product.storage,
      price: product.price,
      active: product.active,
      categoryId: product.category.id,
    });
    setImageFile(null); // Clear image file for edit, user can re-upload
    setImagePreview(product.imageUrl); // Show current image
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      storage: 0,
      price: 0,
      active: true,
      categoryId: 0,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, product: productForm, imageFile });
    } else {
      createProductMutation.mutate({ product: productForm, imageFile });
    }
  };

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  if (productsError || categoriesError) {
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
          <h1 className="font-serif text-4xl font-bold text-foreground">Product Management</h1>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-5 h-5" />
            Add New Product
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden"
        >
          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Image
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {product.category?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {product.storage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          product.active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}>
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(product)}
                            disabled={updateProductMutation.isPending}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {product.active ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deactivateProductMutation.mutate(product.id)}
                              disabled={deactivateProductMutation.isPending}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              {deactivateProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => activateProductMutation.mutate(product.id)}
                              disabled={activateProductMutation.isPending}
                              className="text-muted-foreground hover:text-green-600"
                            >
                              {activateProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Coffee className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl font-serif">No products found. Start by adding a new one!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-foreground">
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingProduct ? "Make changes to the product here." : "Fill in the details to add a new product."}
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
                value={productForm.name}
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
                value={productForm.description}
                onChange={handleInputChange}
                className="col-span-3 bg-background border-border text-foreground min-h-[100px]"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={handleInputChange}
                className="col-span-3 bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="storage" className="text-right">
                Stock
              </Label>
              <Input
                id="storage"
                name="storage"
                type="number"
                value={productForm.storage}
                onChange={handleInputChange}
                className="col-span-3 bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                onValueChange={handleSelectChange}
                value={productForm.categoryId.toString()}
                required
              >
                <SelectTrigger className="col-span-3 bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <Switch
                id="active"
                checked={productForm.active}
                onCheckedChange={handleSwitchChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-background border-border text-foreground file:text-primary file:font-medium"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Product Preview" className="w-16 h-16 object-cover rounded-md border border-border" />
                )}
                {!imagePreview && editingProduct?.imageUrl && (
                  <img src={editingProduct.imageUrl} alt="Current Product Image" className="w-16 h-16 object-cover rounded-md border border-border" />
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={closeFormModal} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingProduct ? (
                  "Save Changes"
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Icone Coffee para o estado vazio da tabela, assumindo que você tem um ícone similar
// Se não tiver, pode remover ou usar um ícone de placeholder
const Coffee = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" x2="6" y1="1" y2="4" />
    <line x1="10" x2="10" y1="1" y2="4" />
    <line x1="14" x2="14" y1="1" y2="4" />
  </svg>
);