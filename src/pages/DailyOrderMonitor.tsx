// src/pages/DailyOrderMonitor.tsx
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Clock,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  CheckCircle2,
  Circle,
  AlertCircle,
  Truck,
  Ban,
  RefreshCw,
  DollarSign,
  Tag,
  ArrowUpDown,
  SlidersHorizontal,
  Coffee,
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  OrderResponseDTO,
  OrderStatus,
  PageableResponse,
} from "@/types";
import { Pagination } from "@/components/Pagination";
import OrderDetailsModal from "@/components/OrderDetailModal";

function getTodayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Formata manualmente para evitar problemas de timezone com toISOString()
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
}

function getTodayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59:59`;
}

function getElapsed(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function getElapsedSeconds(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
}

function getUrgencyLevel(seconds: number): "normal" | "warning" | "critical" {
  if (seconds > 3600) return "critical";
  if (seconds > 1800) return "warning";
  return "normal";
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    rowAccent: string;
    dotClass: string;
  }
> = {
  [OrderStatus.PENDING]: {
    label: "Pendente",
    icon: Circle,
    badgeClass:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    rowAccent: "border-l-amber-400",
    dotClass: "bg-amber-400",
  },
  [OrderStatus.PROCESSING]: {
    label: "Em Preparo",
    icon: Coffee,
    badgeClass:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    rowAccent: "border-l-blue-400",
    dotClass: "bg-blue-400 animate-pulse",
  },
  [OrderStatus.PAID]: {
    label: "Pago",
    icon: DollarSign,
    badgeClass:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    rowAccent: "border-l-emerald-400",
    dotClass: "bg-emerald-400",
  },
  [OrderStatus.SENDED]: {
    label: "Enviado",
    icon: Truck,
    badgeClass:
      "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    rowAccent: "border-l-indigo-400",
    dotClass: "bg-indigo-400",
  },
  [OrderStatus.COMPLETED]: {
    label: "Concluído",
    icon: CheckCircle2,
    badgeClass:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
    rowAccent: "border-l-green-500",
    dotClass: "bg-green-500",
  },
  [OrderStatus.CANCELED]: {
    label: "Cancelado",
    icon: Ban,
    badgeClass:
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    rowAccent: "border-l-red-400",
    dotClass: "bg-red-400",
  },
  [OrderStatus.RECUSE]: {
    label: "Recusado",
    icon: AlertCircle,
    badgeClass:
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    rowAccent: "border-l-rose-400",
    dotClass: "bg-rose-400",
  },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: OrderStatus; showDot?: boolean }> = ({
  status,
  showDot = true,
}) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        cfg.badgeClass
      )}
    >
      {showDot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotClass)} />
      ) : (
        <Icon className="h-3 w-3 shrink-0" />
      )}
      {cfg.label}
    </span>
  );
};

const ElapsedTimer: React.FC<{ dateStr: string }> = ({ dateStr }) => {
  const [label, setLabel] = useState(() => getElapsed(dateStr));
  const [secs, setSecs] = useState(() => getElapsedSeconds(dateStr));

  useEffect(() => {
    const id = setInterval(() => {
      setLabel(getElapsed(dateStr));
      setSecs(getElapsedSeconds(dateStr));
    }, 30_000);
    return () => clearInterval(id);
  }, [dateStr]);

  const urgency = getUrgencyLevel(secs);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        urgency === "critical" && "text-red-500 dark:text-red-400",
        urgency === "warning"  && "text-amber-500 dark:text-amber-400",
        urgency === "normal"   && "text-muted-foreground"
      )}
    >
      <Clock className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
};

const SummaryCard: React.FC<{
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}> = ({ label, value, sub, icon: Icon, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'bg-card border border-border/60 rounded-2xl p-5 flex items-start gap-4',
      'hover:shadow-md transition-shadow duration-200'
    )}
  >
    <div className={cn('p-2.5 rounded-xl shrink-0', accent)}>
      <Icon className='h-5 w-5' />
    </div>

    <div className='min-w-0 flex-1'>
      <p className='text-xs text-muted-foreground font-medium uppercase mb-0.5 tracking-wide'>
        {label}
      </p>

      <p className='font-serif font-bold leading-none text-2xl sm:text-2xl md:text-3xl text-foreground break-words'>
        {value}
      </p>

      {sub && <p className='text-xs text-muted-foreground mt-1'>{sub}</p>}
    </div>
  </motion.div>
);

const OrderRow: React.FC<{
  order: OrderResponseDTO;
  onView: (o: OrderResponseDTO) => void;
  index: number;
}> = ({ order, onView, index }) => {
  const cfg = STATUS_CONFIG[order.orderStatus];
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        "group border-l-4 transition-colors hover:bg-muted/30",
        cfg.rowAccent
      )}
    >
      <td className="px-5 py-4 whitespace-nowrap">
        <span className="font-mono text-sm font-bold text-foreground">
          #{String(order.id).padStart(4, "0")}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
            {order.userEmail.split("@")[0]}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
            {order.userEmail}
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {order.items.slice(0, 3).map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/60"
            >
              <Tag className="h-2.5 w-2.5" />
              {item.productName}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-[11px] text-muted-foreground px-1">
              +{order.items.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <ElapsedTimer dateStr={order.orderDate} />
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <span className="text-sm font-bold text-foreground font-mono">
          {formatCurrency(order.totalPrice)}
        </span>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <StatusBadge status={order.orderStatus} />
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onView(order)}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
            "border border-border/60 text-muted-foreground bg-card",
            "hover:border-primary/40 hover:text-primary hover:bg-primary/5",
            "transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </button>
      </td>
    </motion.tr>
  );
};

// ─── Cartão de Pedido (Mobile) ────────────────────────────────────────────────

const OrderCard: React.FC<{
  order: OrderResponseDTO;
  onView: (o: OrderResponseDTO) => void;
  index: number;
}> = ({ order, onView, index }) => {
  const cfg = STATUS_CONFIG[order.orderStatus];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={cn(
        "bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      )}
    >
      <div className={cn("h-1 w-full", cfg.dotClass.replace("animate-pulse", ""))} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm font-bold text-foreground">
              #{String(order.id).padStart(4, "0")}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {order.userEmail}
            </p>
          </div>
          <StatusBadge status={order.orderStatus} showDot={false} />
        </div>
        <div className="flex flex-wrap gap-1">
          {order.items.slice(0, 4).map((item) => (
            <span
              key={item.id}
              className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/60"
            >
              {item.productName} ×{item.quantity}
            </span>
          ))}
          {order.items.length > 4 && (
            <span className="text-[11px] text-muted-foreground">
              +{order.items.length - 4}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-3">
            <ElapsedTimer dateStr={order.orderDate} />
            <span className="text-sm font-bold font-mono text-foreground">
              {formatCurrency(order.totalPrice)}
            </span>
          </div>
          <button
            onClick={() => onView(order)}
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg",
              "border border-border/60 text-muted-foreground bg-muted/30",
              "hover:border-primary/40 hover:text-primary hover:bg-primary/5",
              "active:scale-95 transition-all duration-150"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Detalhes
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DailyOrderMonitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Datas fixas do dia atual — recalculadas uma única vez por montagem ──
  // Usamos useMemo com [] para garantir que representam "hoje"
  // e nunca mudam durante a sessão (a página é remontada no dia seguinte).
  const todayStart = useMemo(() => getTodayStart(), []);
  const todayEnd   = useMemo(() => getTodayEnd(),   []);

  // Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm]     = useState("");
  const [sortField, setSortField]       = useState<"orderDate" | "totalPrice">("orderDate");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters]   = useState(false);

  // Paginação
  const [page, setPage] = useState(0);
  const size = 10;

  // Refresh manual
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing]   = useState(false);

  // ── Parâmetros de filtro ───────────────────────────────────────────
  // A chave para filtrar só o dia de hoje é passar startDate e endDate
  // diretamente para o endpoint /orders/filter, que o OrderController
  // aceita como LocalDateTime via @DateTimeFormat(ISO.DATE_TIME).
  const filterParams = useMemo(() => {
    const params: {
      startDate: string;
      endDate: string;
      status?: OrderStatus;
      page: number;
      size: number;
      sort: string;
    } = {
      startDate: todayStart, // ← "2026-03-15T00:00:00"
      endDate:   todayEnd,   // ← "2026-03-15T23:59:59"
      page,
      size,
      sort: `${sortField},${sortDir}`,
    };

    if (filterStatus !== "ALL") {
      params.status = filterStatus;
    }

    return params;
  }, [filterStatus, page, sortField, sortDir, todayStart, todayEnd]);

  // ── Busca de pedidos ───────────────────────────────────────────────
  const {
    data: ordersPage,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PageableResponse<OrderResponseDTO>, Error>({
    queryKey: ["orders", "daily-monitor", filterParams],
    queryFn: async () => (await ordersApi.filter(filterParams)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const allOrders    = ordersPage?.content      ?? [];
  const totalPages   = ordersPage?.totalPages   ?? 0;
  const totalElements = ordersPage?.totalElements ?? 0;

  // Filtro de busca local (email / id / produto)
  const orders = useMemo(() => {
    if (!searchTerm.trim()) return allOrders;
    const q = searchTerm.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.userEmail.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  }, [allOrders, searchTerm]);

  // ── Métricas derivadas ─────────────────────────────────────────────
  const metrics = useMemo(() => {
    const revenue    = allOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const pending    = allOrders.filter((o) => o.orderStatus === OrderStatus.PENDING).length;
    const processing = allOrders.filter((o) => o.orderStatus === OrderStatus.PROCESSING).length;
    const completed  = allOrders.filter((o) => o.orderStatus === OrderStatus.COMPLETED).length;
    return { revenue, pending, processing, completed };
  }, [allOrders]);

  // ── Mutation de status ─────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; newStatus: OrderStatus }) =>
      ordersApi.updateOrderStatus(data.orderId, data.newStatus),
    onSuccess: () => {
      toast({ title: "Status atualizado", description: "Pedido atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["orders", "daily-monitor"] });
      setIsDetailsModalOpen(false);
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────
  const openDetails  = (order: OrderResponseDTO) => { setSelectedOrder(order); setIsDetailsModalOpen(true); };
  const closeDetails = () => { setIsDetailsModalOpen(false); setSelectedOrder(null); };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  };

  const toggleSort = (field: "orderDate" | "totalPrice") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
    setPage(0);
  };

  const clearFilters = () => { setFilterStatus("ALL"); setSearchTerm(""); setPage(0); };

  const hasActiveFilters = filterStatus !== "ALL" || searchTerm.trim() !== "";

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

        {/* ── Cabeçalho ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Painel Administrativo
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Monitor de Pedidos
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Atualizado às{" "}
              {lastRefreshed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isFetching}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4", (isRefreshing || isFetching) && "animate-spin")} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </motion.div>

        {/* ── Cards de Métricas ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <SummaryCard
            label="Pedidos Hoje"
            value={isLoading ? "—" : totalElements}
            icon={ShoppingBag}
            accent="bg-primary/10 text-primary"
          />
          <SummaryCard
            label="Receita"
            value={isLoading ? "—" : formatCurrency(metrics.revenue)}
            icon={DollarSign}
            accent="bg-emerald-500/10 text-emerald-600"
          />
          <SummaryCard
            label="Pendentes"
            value={isLoading ? "—" : metrics.pending}
            sub="aguardando ação"
            icon={Circle}
            accent="bg-amber-500/10 text-amber-600"
          />
          <SummaryCard
            label="Em Preparo"
            value={isLoading ? "—" : metrics.processing}
            icon={Coffee}
            accent="bg-blue-500/10 text-blue-600"
          />
          <SummaryCard
            label="Concluídos"
            value={isLoading ? "—" : metrics.completed}
            icon={CheckCircle2}
            accent="bg-green-500/10 text-green-600"
          />
        </div>

        {/* ── Filtros ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por e-mail, ID ou produto…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                className="pl-9 bg-background rounded-xl"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "gap-2 rounded-xl shrink-0",
                showFilters && "border-primary/40 text-primary bg-primary/5"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
              {showFilters
                ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
                : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-border/40 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Status do Pedido
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setFilterStatus("ALL"); setPage(0); }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                          filterStatus === "ALL"
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
                        )}
                      >
                        Todos
                      </button>
                      {Object.values(OrderStatus).map((status) => {
                        const cfg = STATUS_CONFIG[status];
                        return (
                          <button
                            key={status}
                            onClick={() => { setFilterStatus(status); setPage(0); }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                              filterStatus === status
                                ? cfg.badgeClass
                                : "bg-card text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
                            )}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Limpar filtros
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filterStatus !== "ALL" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full">
                  {STATUS_CONFIG[filterStatus].label}
                  <button onClick={() => setFilterStatus("ALL")} className="ml-0.5 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="ml-0.5 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Tabela / Lista de Pedidos ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-border/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-bold text-foreground">
                Pedidos de Hoje
              </h2>
              {!isLoading && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                  {orders.length} de {totalElements}
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ordenar por:</span>
              {(["orderDate", "totalPrice"] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                    sortField === field
                      ? "border-primary/40 text-primary bg-primary/5"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {field === "orderDate"
                    ? <><Clock className="h-3 w-3" />Hora</>
                    : <><DollarSign className="h-3 w-3" />Valor</>}
                  {sortField === field && <ArrowUpDown className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando pedidos de hoje…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-foreground">
                  Nenhum pedido encontrado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? "Tente ajustar os filtros aplicados."
                    : "Nenhum pedido registrado hoje."}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl">
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Pedido", "Cliente", "Itens"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                      {(["Tempo", "Valor"] as const).map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left">
                          <button
                            onClick={() => toggleSort(h === "Tempo" ? "orderDate" : "totalPrice")}
                            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                          >
                            {h}
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                      ))}
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {orders.map((order, i) => (
                      <OrderRow key={order.id} order={order} onView={openDetails} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden p-4 space-y-3">
                <div className="flex items-center gap-2 pb-1">
                  <span className="text-xs text-muted-foreground">Ordenar:</span>
                  {(["orderDate", "totalPrice"] as const).map((field) => (
                    <button
                      key={field}
                      onClick={() => toggleSort(field)}
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-lg border transition-all",
                        sortField === field
                          ? "border-primary/40 text-primary bg-primary/5"
                          : "border-border/60 text-muted-foreground"
                      )}
                    >
                      {field === "orderDate" ? "Hora" : "Valor"}{" "}
                      {sortField === field && (sortDir === "desc" ? "↓" : "↑")}
                    </button>
                  ))}
                </div>
                {orders.map((order, i) => (
                  <OrderCard key={order.id} order={order} onView={openDetails} index={i} />
                ))}
              </div>
            </>
          )}

          {/* Paginação */}
          {!isLoading && totalPages > 1 && (
            <div className="px-5 py-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages} · {totalElements} pedidos hoje
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            </div>
          )}

          {/* Fetch silencioso */}
          {isFetching && !isLoading && (
            <div className="px-5 py-2 border-t border-border/30 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Atualizando…</p>
            </div>
          )}
        </motion.div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeDetails}
          order={selectedOrder}
          onUpdateStatus={updateStatusMutation.mutate}
          isUpdatingStatus={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}