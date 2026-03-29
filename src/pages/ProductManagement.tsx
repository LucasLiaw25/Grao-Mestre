// src/pages/ProductManagement.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Package,
  Tag,
  TrendingUp,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Archive,
} from "lucide-react";
import { productsApi, categoriesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  ProductRequestDTO,
  ProductResponseDTO,
  CategoryResponseDTO,
} from "@/types";
import { cn } from "@/lib/utils";

// ── Tipos de filtro ────────────────────────────────────────────────────────────
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
type PriceFilter = "ALL" | "UNDER_50" | "50_200" | "200_500" | "OVER_500";

// ── Configurações de filtro de status ─────────────────────────────────────────
const STATUS_FILTER_CONFIG: {
  value: StatusFilter;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
  badgeClass: string;
}[] = [
  {
    value: "ALL",
    label: "Todos",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Package className="h-3.5 w-3.5" />,
    badgeClass: "bg-stone-200 text-stone-700",
  },
  {
    value: "ACTIVE",
    label: "Ativos",
    activeClass: "bg-emerald-700 text-emerald-50 border-emerald-700",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "INACTIVE",
    label: "Inativos",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-100 text-red-800",
  },
];

// ── Configurações de filtro de estoque ────────────────────────────────────────
const STOCK_FILTER_CONFIG: {
  value: StockFilter;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
  badgeClass: string;
  matcher: (stock: number) => boolean;
}[] = [
  {
    value: "ALL",
    label: "Todo Estoque",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Layers className="h-3.5 w-3.5" />,
    badgeClass: "bg-stone-200 text-stone-700",
    matcher: () => true,
  },
  {
    value: "IN_STOCK",
    label: "Disponível",
    activeClass: "bg-teal-700 text-teal-50 border-teal-700",
    icon: <Archive className="h-3.5 w-3.5" />,
    badgeClass: "bg-teal-100 text-teal-800",
    matcher: (s) => s > 10,
  },
  {
    value: "LOW_STOCK",
    label: "Estoque Baixo",
    activeClass: "bg-amber-700 text-amber-50 border-amber-700",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    badgeClass: "bg-amber-100 text-amber-800",
    matcher: (s) => s > 0 && s <= 10,
  },
  {
    value: "OUT_OF_STOCK",
    label: "Esgotado",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-100 text-red-800",
    matcher: (s) => s === 0,
  },
];

// ── Configurações de filtro de preço ─────────────────────────────────────────
const PRICE_FILTER_CONFIG: {
  value: PriceFilter;
  label: string;
  matcher: (price: number) => boolean;
}[] = [
  { value: "ALL",       label: "Qualquer Preço", matcher: () => true },
  { value: "UNDER_50",  label: "Até R$ 50",      matcher: (p) => p < 50 },
  { value: "50_200",    label: "R$ 50 – 200",    matcher: (p) => p >= 50 && p <= 200 },
  { value: "200_500",   label: "R$ 200 – 500",   matcher: (p) => p > 200 && p <= 500 },
  { value: "OVER_500",  label: "Acima de R$ 500",matcher: (p) => p > 500 },
];

// ── Métricas resumo ───────────────────────────────────────────────────────────
const METRIC_CONFIG = [
  {
    key: "total",
    label: "Total",
    icon: <Package className="h-4 w-4" />,
    colorClass: "text-stone-700",
    bgClass: "bg-stone-50 border-stone-100",
    iconBg: "bg-stone-100",
  },
  {
    key: "active",
    label: "Ativos",
    icon: <CheckCircle className="h-4 w-4" />,
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    key: "lowStock",
    label: "Est. Baixo",
    icon: <AlertTriangle className="h-4 w-4" />,
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-100",
  },
  {
    key: "outOfStock",
    label: "Esgotados",
    icon: <XCircle className="h-4 w-4" />,
    colorClass: "text-red-700",
    bgClass: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
  },
];

// ── Stock Badge helper ────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
        <XCircle className="h-2.5 w-2.5" /> Esgotado
      </span>
    );
  if (stock <= 10)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
        <AlertTriangle className="h-2.5 w-2.5" /> {stock} un.
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
      <Archive className="h-2.5 w-2.5" /> {stock} un.
    </span>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────────
export default function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
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

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");

  // Expansão de cards mobile
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  // Fetch
  const { data: products, isLoading: isLoadingProducts } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  // ── Contagens ─────────────────────────────────────────────────────────────────
  const metrics = useMemo(() => ({
    total:      products?.length ?? 0,
    active:     products?.filter((p) => p.active).length ?? 0,
    lowStock:   products?.filter((p) => p.storage > 0 && p.storage <= 10).length ?? 0,
    outOfStock: products?.filter((p) => p.storage === 0).length ?? 0,
  }), [products]);

  // ── Filtragem combinada ───────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.active) ||
        (statusFilter === "INACTIVE" && !p.active);

      const matchesStock =
        STOCK_FILTER_CONFIG.find((f) => f.value === stockFilter)?.matcher(p.storage) ?? true;

      const matchesPrice =
        PRICE_FILTER_CONFIG.find((f) => f.value === priceFilter)?.matcher(p.price) ?? true;

      const matchesCategory =
        categoryFilter === "ALL" || p.category?.id === categoryFilter;

      return matchesSearch && matchesStatus && matchesStock && matchesPrice && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, stockFilter, priceFilter, categoryFilter]);

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    stockFilter !== "ALL" ||
    priceFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    !!searchTerm;

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStockFilter("ALL");
    setPriceFilter("ALL");
    setCategoryFilter("ALL");
  };

  const countByStatus = (s: StatusFilter) => {
    if (!products) return 0;
    if (s === "ALL") return products.length;
    if (s === "ACTIVE") return products.filter((p) => p.active).length;
    return products.filter((p) => !p.active).length;
  };

  const countByStock = (s: StockFilter) => {
    if (!products) return 0;
    const cfg = STOCK_FILTER_CONFIG.find((f) => f.value === s)!;
    return products.filter((p) => cfg.matcher(p.storage)).length;
  };

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createProductMutation = useMutation({
    mutationFn: (d: { product: ProductRequestDTO; imageFile?: File }) =>
      productsApi.create(d.product, d.imageFile),
    onSuccess: () => {
      toast({ title: "Produto criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao criar produto.", variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: (d: { id: number; product: ProductRequestDTO; imageFile?: File }) =>
      productsApi.update(d.id, d.product, d.imageFile),
    onSuccess: () => {
      toast({ title: "Produto atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar produto.", variant: "destructive" }),
  });

  const deactivateProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.deactivate(id),
    onSuccess: () => {
      toast({ title: "Produto desativado." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () =>
      toast({ title: "Erro ao desativar produto.", variant: "destructive" }),
  });

  const activateProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.activate(id),
    onSuccess: () => {
      toast({ title: "Produto ativado." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () =>
      toast({ title: "Erro ao ativar produto.", variant: "destructive" }),
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      storage: 0,
      price: 0,
      active: true,
      categoryId: categories?.[0]?.id ?? 0,
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
    setImageFile(null);
    setImagePreview(product.imageUrl);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
    setProductForm({ name: "", description: "", storage: 0, price: 0, active: true, categoryId: 0 });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, product: productForm, imageFile: imageFile ?? undefined });
    } else {
      createProductMutation.mutate({ product: productForm, imageFile: imageFile ?? undefined });
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────────
  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
          <p className="text-stone-500 text-sm font-medium">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-24 pb-24 overflow-x-hidden">
      <div className="w-full max-w-[95vw] sm:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8">

        {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground tracking-tight">
              Gestão de Produtos
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {filteredProducts.length > 0
                ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? "s" : ""} encontrado${filteredProducts.length !== 1 ? "s" : ""}`
                : "Nenhum produto no catálogo"}
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="gap-2 bg-stone-800 hover:bg-stone-900 text-amber-50 rounded-xl px-5 py-2.5 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </motion.div>

        {/* ── Cards de métricas ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {METRIC_CONFIG.map((m) => (
            <div
              key={m.key}
              className={cn(
                "rounded-2xl border p-4 flex flex-col gap-2 transition-all",
                m.bgClass
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.iconBg)}>
                <span className={m.colorClass}>{m.icon}</span>
              </div>
              <div>
                <p className={cn("text-2xl font-black", m.colorClass)}>
                  {metrics[m.key as keyof typeof metrics]}
                </p>
                <p className={cn("text-xs font-semibold mt-0.5 opacity-80", m.colorClass)}>
                  {m.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Filtros ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros em card */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5 shadow-sm">

            {/* Status */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTER_CONFIG.map((f) => {
                  const isActive = statusFilter === f.value;
                  const count = countByStatus(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
                        isActive
                          ? f.activeClass + " shadow-sm"
                          : "bg-background border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                      )}
                    >
                      {f.icon}
                      <span className="hidden sm:inline">{f.label}</span>
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                        isActive ? "bg-white/20 text-white" : f.badgeClass
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estoque */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                Estoque
              </p>
              <div className="flex flex-wrap gap-2">
                {STOCK_FILTER_CONFIG.map((f) => {
                  const isActive = stockFilter === f.value;
                  const count = countByStock(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStockFilter(f.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
                        isActive
                          ? f.activeClass + " shadow-sm"
                          : "bg-background border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                      )}
                    >
                      {f.icon}
                      <span className="hidden sm:inline">{f.label}</span>
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                        isActive ? "bg-white/20 text-white" : f.badgeClass
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categoria + Preço lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoria */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Categoria
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter("ALL")}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                      categoryFilter === "ALL"
                        ? "bg-stone-800 text-amber-50 border-stone-800"
                        : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    Todas
                  </button>
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id === categoryFilter ? "ALL" : cat.id)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                        categoryFilter === cat.id
                          ? "bg-stone-800 text-amber-50 border-stone-800"
                          : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Faixa de Preço */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Faixa de Preço
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_FILTER_CONFIG.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setPriceFilter(f.value)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                        priceFilter === f.value
                          ? "bg-stone-800 text-amber-50 border-stone-800"
                          : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Badges de filtros ativos */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-xs text-stone-500 font-medium">
                  Mostrando{" "}
                  <span className="font-black text-foreground">{filteredProducts.length}</span>{" "}
                  {filteredProducts.length === 1 ? "produto" : "produtos"}
                </span>

                {statusFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {STATUS_FILTER_CONFIG.find((f) => f.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter("ALL")} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {stockFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {STOCK_FILTER_CONFIG.find((f) => f.value === stockFilter)?.label}
                    <button onClick={() => setStockFilter("ALL")} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {priceFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {PRICE_FILTER_CONFIG.find((f) => f.value === priceFilter)?.label}
                    <button onClick={() => setPriceFilter("ALL")} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {categoryFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {categories?.find((c) => c.id === categoryFilter)?.name}
                    <button onClick={() => setCategoryFilter("ALL")} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-stone-500 underline underline-offset-2 hover:text-red-600 transition-colors"
                >
                  Limpar tudo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Tabela / Cards ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
        >
          {filteredProducts.length > 0 ? (
            <>
              {/* ── Desktop: tabela ─────────────────────────────────────────── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-stone-50/80 text-left">
                      {["Produto", "Categoria", "Preço", "Estoque", "Status", "Ações"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredProducts.map((product) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        {/* Produto */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-11 w-11 rounded-xl object-cover border border-stone-100 shrink-0"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                                <ImageIcon className="h-5 w-5 text-stone-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-foreground">{product.name}</p>
                              <p className="text-xs text-stone-400 max-w-[180px] truncate">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                            <Tag className="h-3 w-3" />
                            {product.category?.name ?? "—"}
                          </span>
                        </td>

                        {/* Preço */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-foreground">
                            {formatCurrency(product.price)}
                          </span>
                        </td>

                        {/* Estoque */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StockBadge stock={product.storage} />
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
                            product.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {product.active
                              ? <><CheckCircle className="h-3 w-3" /> Ativo</>
                              : <><XCircle className="h-3 w-3" /> Inativo</>}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {product.active ? (
                              <button
                                onClick={() => deactivateProductMutation.mutate(product.id)}
                                disabled={deactivateProductMutation.isPending}
                                className="p-2 rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Desativar"
                              >
                                {deactivateProductMutation.isPending
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <XCircle className="w-4 h-4" />}
                              </button>
                            ) : (
                              <button
                                onClick={() => activateProductMutation.mutate(product.id)}
                                disabled={activateProductMutation.isPending}
                                className="p-2 rounded-xl text-stone-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                title="Ativar"
                              >
                                {activateProductMutation.isPending
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <CheckCircle className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile: cards expansíveis ───────────────────────────────── */}
              <div className="sm:hidden divide-y divide-border/50">
                {filteredProducts.map((product) => {
                  const isExpanded = expandedCardId === product.id;
                  return (
                    <div key={product.id} className="p-4">
                      {/* Linha principal (sempre visível) */}
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() =>
                          setExpandedCardId(isExpanded ? null : product.id)
                        }
                      >
                        {/* Imagem */}
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-14 rounded-xl object-cover border border-stone-100 shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                            <ImageIcon className="h-6 w-6 text-stone-400" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-foreground truncate">{product.name}</p>
                            <span className={cn(
                              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              product.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-700 border-red-100"
                            )}>
                              {product.active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-black text-foreground">
                              {formatCurrency(product.price)}
                            </span>
                            <StockBadge stock={product.storage} />
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5 truncate">
                            {product.category?.name}
                          </p>
                        </div>

                        {/* Chevron */}
                        <div className="shrink-0 text-stone-400">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Painel expandido */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 space-y-3">
                              {/* Descrição */}
                              <p className="text-xs text-stone-500 leading-relaxed">
                                {product.description}
                              </p>

                              {/* Detalhes */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 text-center">
                                  <p className="text-[9px] uppercase font-black text-stone-400 mb-1">Preço</p>
                                  <p className="text-sm font-black text-foreground">
                                    {formatCurrency(product.price)}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 text-center">
                                  <p className="text-[9px] uppercase font-black text-stone-400 mb-1">Estoque</p>
                                  <p className={cn(
                                    "text-sm font-black",
                                    product.storage === 0 ? "text-red-600" :
                                    product.storage <= 10 ? "text-amber-600" : "text-teal-600"
                                  )}>
                                    {product.storage}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 text-center">
                                  <p className="text-[9px] uppercase font-black text-stone-400 mb-1">Categoria</p>
                                  <p className="text-[10px] font-bold text-foreground truncate">
                                    {product.category?.name ?? "—"}
                                  </p>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Editar
                                </button>
                                {product.active ? (
                                  <button
                                    onClick={() => deactivateProductMutation.mutate(product.id)}
                                    disabled={deactivateProductMutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    {deactivateProductMutation.isPending
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <><XCircle className="h-3.5 w-3.5" /> Desativar</>}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => activateProductMutation.mutate(product.id)}
                                    disabled={activateProductMutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                  >
                                    {activateProductMutation.isPending
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <><CheckCircle className="h-3.5 w-3.5" /> Ativar</>}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── Estado vazio ─────────────────────────────────────────────── */
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3 text-stone-400">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
                  <Package className="w-6 h-6 opacity-50" />
                </div>
                <p className="font-serif text-lg font-semibold text-stone-500">
                  Nenhum produto encontrado
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Tente remover ou combinar filtros diferentes."
                    : "Adicione um novo produto ao catálogo."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-1 text-xs font-bold text-stone-600 underline underline-offset-2 hover:text-red-600 transition-colors"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Modal de Formulário ──────────────────────────────────────────────── */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] bg-card text-foreground rounded-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-stone-50/80">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-bold text-foreground">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription className="text-stone-500 text-sm">
                {editingProduct
                  ? "Atualize as informações do produto."
                  : "Preencha os dados para adicionar ao catálogo."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Imagem preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-stone-200"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-stone-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500">
                  Imagem do Produto
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setImageFile(f);
                      setImagePreview(URL.createObjectURL(f));
                    }
                  }}
                  className="bg-background border-stone-200 text-foreground file:text-stone-700 file:font-semibold file:text-xs rounded-xl"
                />
                <p className="text-[10px] text-stone-400">PNG, JPG até 5MB</p>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-stone-500">Nome</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Café Especial Etiópia"
                required
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-stone-500">Descrição</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descreva o produto..."
                required
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300 min-h-[80px] resize-none"
              />
            </div>

            {/* Preço + Estoque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Preço (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: parseFloat(e.target.value) }))}
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                  <Archive className="h-3 w-3" /> Estoque
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.storage}
                  onChange={(e) => setProductForm((p) => ({ ...p, storage: parseInt(e.target.value) }))}
                  required
                  className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-stone-500 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Categoria
              </Label>
              <Select
                value={productForm.categoryId.toString()}
                onValueChange={(v) => setProductForm((p) => ({ ...p, categoryId: parseInt(v) }))}
                required
              >
                <SelectTrigger className="rounded-xl border-stone-200 bg-background text-foreground">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-card border-stone-200">
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ativo */}
            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-foreground">Produto Ativo</p>
                <p className="text-xs text-stone-500">Visível no catálogo para clientes</p>
              </div>
              <Switch
                checked={productForm.active}
                onCheckedChange={(v) => setProductForm((p) => ({ ...p, active: v }))}
              />
            </div>

            {/* Footer */}
            <DialogFooter className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeFormModal}
                className="flex-1 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="flex-1 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-50 font-bold"
              >
                {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingProduct ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Produto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}