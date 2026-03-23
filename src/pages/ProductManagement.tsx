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
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
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

/* ────────────────────────────────
   Helpers & Configurações
   ─────────────────────────────── */

// Tipos de filtro
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
type PriceFilter = "ALL" | "UNDER_50" | "50_200" | "200_500" | "OVER_500";

// Configurações de filtro de status
const STATUS_FILTER_CONFIG = [
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
] as const;

// Configurações de filtro de estoque
const STOCK_FILTER_CONFIG = [
  {
    value: "ALL",
    label: "Todo Estoque",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Layers className="h-3.5 w-3.5" />,
    badgeClass: "bg-stone-200 text-stone-700",
    matcher: (_: number) => true,
  },
  {
    value: "IN_STOCK",
    label: "Disponível",
    activeClass: "bg-teal-700 text-teal-50 border-teal-700",
    icon: <Archive className="h-3.5 w-3.5" />,
    badgeClass: "bg-teal-100 text-teal-800",
    matcher: (s: number) => s > 10,
  },
  {
    value: "LOW_STOCK",
    label: "Estoque Baixo",
    activeClass: "bg-amber-700 text-amber-50 border-amber-700",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    badgeClass: "bg-amber-100 text-amber-800",
    matcher: (s: number) => s > 0 && s <= 10,
  },
  {
    value: "OUT_OF_STOCK",
    label: "Esgotado",
    activeClass: "bg-red-700 text-red-50 border-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-100 text-red-800",
    matcher: (s: number) => s === 0,
  },
] as const;

// Configurações de filtro de preço
const PRICE_FILTER_CONFIG = [
  { value: "ALL",      label: "Qualquer Preço",  matcher: (_: number) => true },
  { value: "UNDER_50", label: "Até R$ 50",       matcher: (p: number) => p < 50 },
  { value: "50_200",   label: "R$ 50 – 200",     matcher: (p: number) => p >= 50 && p <= 200 },
  { value: "200_500",  label: "R$ 200 – 500",    matcher: (p: number) => p > 200 && p <= 500 },
  { value: "OVER_500", label: "Acima de R$ 500", matcher: (p: number) => p > 500 },
] as const;

// Métricas resumo
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
] as const;

/* ────────────────────────────────
   Badge de Estoque
   ─────────────────────────────── */
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

/* ────────────────────────────────
   Pequeno tile usado no card mobile
   ─────────────────────────────── */
function MetricTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 text-center">
      <p className="text-[9px] uppercase font-black text-stone-400 mb-1">
        {label}
      </p>
      <p className={cn("text-sm font-black truncate", color)}>{value}</p>
    </div>
  );
}

/* ────────────────────────────────
   Card Mobile reaproveitável
   ─────────────────────────────── */
interface ProductMobileCardProps {
  product: ProductResponseDTO;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  loadingToggle: boolean;
}

function ProductMobileCard({
  product,
  isExpanded,
  onToggle,
  onEdit,
  onToggleActive,
  loadingToggle,
}: ProductMobileCardProps) {
  return (
    <motion.div layout className="p-4">
      {/* Cabeçalho */}
      <motion.div
        layout
        className="flex items-center gap-3"
        onClick={onToggle}
      >
        {/* Imagem / Placeholder */}
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

        {/* Informações principais */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">{product.name}</p>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs font-black text-foreground">
              {formatCurrency(product.price)}
            </span>
            <StockBadge stock={product.storage} />
          </div>

          <p className="text-[10px] text-stone-400 mt-0.5 truncate">
            {product.category?.name ?? "—"}
          </p>
        </div>

        {/* Botão Ativar/Desativar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive();
          }}
          disabled={loadingToggle}
          className={cn(
            "p-2 rounded-xl transition-colors shrink-0",
            product.active
              ? "text-stone-400 hover:bg-red-50 hover:text-red-600"
              : "text-stone-400 hover:bg-emerald-50 hover:text-emerald-600"
          )}
        >
          {loadingToggle ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : product.active ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </button>

        {/* Chevron */}
        <div className="shrink-0 text-stone-400 ml-1">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </motion.div>

      {/* Painel Expandido */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {/* Descrição */}
              <p className="text-xs text-stone-500 leading-relaxed">
                {product.description}
              </p>

              {/* Métricas rápidas */}
              <div className="grid grid-cols-3 gap-2">
                <MetricTile
                  label="Preço"
                  value={formatCurrency(product.price)}
                />
                <MetricTile
                  label="Estoque"
                  value={product.storage.toString()}
                  color={
                    product.storage === 0
                      ? "text-red-600"
                      : product.storage <= 10
                      ? "text-amber-600"
                      : "text-teal-600"
                  }
                />
                <MetricTile
                  label="Status"
                  value={product.active ? "Ativo" : "Inativo"}
                  color={product.active ? "text-emerald-600" : "text-red-600"}
                />
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={onToggleActive}
                  disabled={loadingToggle}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-colors disabled:opacity-50",
                    product.active
                      ? "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  {loadingToggle ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : product.active ? (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Desativar
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> Ativar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ────────────────────────────────
   Componente Principal
   ─────────────────────────────── */
export default function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /* ── Estado de formulário & modal ─────────────────────────────────────── */
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductResponseDTO | null>(null);
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

  /* ── Filtros ──────────────────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");

  /* ── Expansão de cards mobile ─────────────────────────────────────────── */
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  /* ── Fetch ────────────────────────────────────────────────────────────── */
  const { data: products, isLoading: isLoadingProducts } =
    useQuery<ProductResponseDTO[]>({
      queryKey: ["products"],
      queryFn: async () => (await productsApi.getAll()).data,
    });

  const { data: categories, isLoading: isLoadingCategories } =
    useQuery<CategoryResponseDTO[]>({
      queryKey: ["categories"],
      queryFn: async () => (await categoriesApi.getAll()).data,
    });

  /* ── Métricas resumo ──────────────────────────────────────────────────── */
  const metrics = useMemo(
    () => ({
      total: products?.length ?? 0,
      active: products?.filter((p) => p.active).length ?? 0,
      lowStock: products?.filter((p) => p.storage > 0 && p.storage <= 10)
        .length ?? 0,
      outOfStock: products?.filter((p) => p.storage === 0).length ?? 0,
    }),
    [products]
  );

  /* ── Filtragem combinada ──────────────────────────────────────────────── */
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
        STOCK_FILTER_CONFIG.find((f) => f.value === stockFilter)?.matcher(
          p.storage
        ) ?? true;

      const matchesPrice =
        PRICE_FILTER_CONFIG.find((f) => f.value === priceFilter)?.matcher(
          p.price
        ) ?? true;

      const matchesCategory =
        categoryFilter === "ALL" || p.category?.id === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStock &&
        matchesPrice &&
        matchesCategory
      );
    });
  }, [
    products,
    searchTerm,
    statusFilter,
    stockFilter,
    priceFilter,
    categoryFilter,
  ]);

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

  /* ── Counts auxiliares para badges de filtros ─────────────────────────── */
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

  /* ── Mutations (create / update / toggle) ─────────────────────────────── */
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
    mutationFn: (d: {
      id: number;
      product: ProductRequestDTO;
      imageFile?: File;
    }) => productsApi.update(d.id, d.product, d.imageFile),
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

  /* ── Helpers de modal ─────────────────────────────────────────────────── */
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
      updateProductMutation.mutate({
        id: editingProduct.id,
        product: productForm,
        imageFile: imageFile ?? undefined,
      });
    } else {
      createProductMutation.mutate({
        product: productForm,
        imageFile: imageFile ?? undefined,
      });
    }
  };

  /* ── Loading global ───────────────────────────────────────────────────── */
  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
          <p className="text-stone-500 text-sm font-medium">
            Carregando produtos...
          </p>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────────────
     Render
     ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Cabeçalho */}
        {/* ... (nada alterado aqui) ... */}

        {/* Cards de métricas */}
        {/* ... (nada alterado aqui) ... */}

        {/* Filtros */}
        {/* ... (nada alterado aqui) ... */}

        {/* Tabela / Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
        >
          {filteredProducts.length > 0 ? (
            <>
              {/* ── Desktop: tabela (inalterada) ─────────────────────────── */}
              <div className="hidden sm:block overflow-x-auto">
                {/* ...tabela existente... */}
              </div>

              {/* ── Mobile: cartões expansíveis (NOVO) ───────────────────── */}
              <div className="sm:hidden divide-y divide-border/50">
                {filteredProducts.map((product) => (
                  <ProductMobileCard
                    key={product.id}
                    product={product}
                    isExpanded={expandedCardId === product.id}
                    onToggle={() =>
                      setExpandedCardId(
                        expandedCardId === product.id ? null : product.id
                      )
                    }
                    onEdit={() => openEditModal(product)}
                    onToggleActive={() =>
                      product.active
                        ? deactivateProductMutation.mutate(product.id)
                        : activateProductMutation.mutate(product.id)
                    }
                    loadingToggle={
                      deactivateProductMutation.isPending ||
                      activateProductMutation.isPending
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            /* Estado vazio (inalterado) */
            <div className="py-20 text-center">
              {/* ...conteúdo vazio... */}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}