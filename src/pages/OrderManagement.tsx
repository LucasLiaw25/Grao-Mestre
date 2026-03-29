// src/pages/OrderManagement.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Edit,
  Filter,
  Loader2,
  FileText,
  ShoppingBag,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Ban,
  X,
  TrendingUp,
  Package,
  Calendar,
} from "lucide-react";
import { ordersApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  OrderResponseDTO,
  OrderStatus,
  TimePeriod,
  PaymentMethod,
  PageableResponse,
  UserResponseDTO,
} from "@/types";
import { Pagination } from "@/components/Pagination";
import OrderDetailsModal from "@/components/OrderDetailModal";

// ── Configuração de filtros de status ─────────────────────────────────────────
type StatusFilter = "ALL" | OrderStatus;

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
    value: OrderStatus.PENDING,
    label: "Pendente",
    activeClass: "bg-amber-700 text-amber-50 border-amber-700",
    icon: <Clock className="h-3.5 w-3.5" />,
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    value: OrderStatus.PROCESSING,
    label: "Processando",
    activeClass: "bg-indigo-700 text-indigo-50 border-indigo-700",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  {
    value: OrderStatus.PAID,
    label: "Pago",
    activeClass: "bg-emerald-700 text-emerald-50 border-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    value: OrderStatus.COMPLETED,
    label: "Concluído",
    activeClass: "bg-teal-700 text-teal-50 border-teal-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    badgeClass: "bg-teal-100 text-teal-800",
  },
  {
    value: OrderStatus.SENDED,
    label: "Enviado",
    activeClass: "bg-blue-700 text-blue-50 border-blue-700",
    icon: <Send className="h-3.5 w-3.5" />,
    badgeClass: "bg-blue-100 text-blue-800",
  },
  {
    value: OrderStatus.CANCELED,
    label: "Cancelado",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-100 text-red-800",
  },
  {
    value: OrderStatus.RECUSE,
    label: "Recusado",
    activeClass: "bg-rose-800 text-rose-50 border-rose-800",
    icon: <Ban className="h-3.5 w-3.5" />,
    badgeClass: "bg-rose-100 text-rose-800",
  },
];

// ── Configuração de filtros de período ────────────────────────────────────────
const TIME_PERIOD_CONFIG: {
  value: TimePeriod | "ALL";
  label: string;
}[] = [
  { value: "ALL",                label: "Todo período"   },
  { value: TimePeriod.TODAY,     label: "Hoje"           },
  { value: TimePeriod.YESTERDAY, label: "Ontem"          },
  { value: TimePeriod.THIS_WEEK, label: "Esta semana"    },
  { value: TimePeriod.LAST_WEEK, label: "Semana passada" },
  { value: TimePeriod.THIS_MONTH,label: "Este mês"       },
  { value: TimePeriod.LAST_MONTH,label: "Mês passado"    },
  { value: TimePeriod.CUSTOM,    label: "Personalizado"  },
];

// ── Mapeamento de cores de status para a tabela ───────────────────────────────
const STATUS_STYLE_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:    "bg-amber-50 text-amber-800 border border-amber-200",
  [OrderStatus.PROCESSING]: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  [OrderStatus.PAID]:       "bg-emerald-50 text-emerald-800 border border-emerald-200",
  [OrderStatus.COMPLETED]:  "bg-teal-50 text-teal-800 border border-teal-200",
  [OrderStatus.SENDED]:     "bg-blue-50 text-blue-800 border border-blue-200",
  [OrderStatus.CANCELED]:   "bg-red-50 text-red-800 border border-red-200",
  [OrderStatus.RECUSE]:     "bg-rose-50 text-rose-800 border border-rose-200",
};

// ── Métricas de resumo ─────────────────────────────────────────────────────────
const METRIC_CONFIG = [
  {
    status: OrderStatus.PENDING,
    label: "Pendentes",
    icon: <Clock className="h-4 w-4" />,
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-100",
  },
  {
    status: OrderStatus.PROCESSING,
    label: "Processando",
    icon: <RefreshCw className="h-4 w-4" />,
    colorClass: "text-indigo-700",
    bgClass: "bg-indigo-50 border-indigo-100",
    iconBg: "bg-indigo-100",
  },
  {
    status: OrderStatus.COMPLETED,
    label: "Concluídos",
    icon: <CheckCircle2 className="h-4 w-4" />,
    colorClass: "text-teal-700",
    bgClass: "bg-teal-50 border-teal-100",
    iconBg: "bg-teal-100",
  },
  {
    status: OrderStatus.CANCELED,
    label: "Cancelados",
    icon: <XCircle className="h-4 w-4" />,
    colorClass: "text-red-700",
    bgClass: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
  },
];

// ── Componente principal ───────────────────────────────────────────────────────
export default function OrderManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [filterTimePeriod, setFilterTimePeriod] = useState<TimePeriod | "ALL">("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterUserId, setFilterUserId] = useState<string>("ALL");
  const [filterOrderId, setFilterOrderId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Paginação
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sort] = useState("orderDate,desc");

  // ── Fetch de usuários ────────────────────────────────────────────────────────
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserResponseDTO[], Error>({
    queryKey: ["users"],
    queryFn: async () => (await usersApi.getAll()).data,
    staleTime: 5 * 60 * 1000,
  });

  // ── Parâmetros de filtro ─────────────────────────────────────────────────────
  const filterParams = useMemo(() => {
    const params: Record<string, unknown> = { page, size, sort };

    if (filterStatus !== "ALL") params.status = filterStatus;
    if (filterUserId !== "ALL" && !isNaN(parseInt(filterUserId)))
      params.userId = parseInt(filterUserId);
    if (filterOrderId) params.orderId = parseInt(filterOrderId);
    if (filterTimePeriod !== "ALL") {
      params.period = filterTimePeriod;
      if (filterTimePeriod === TimePeriod.CUSTOM) {
        if (customStartDate) params.startDate = customStartDate;
        if (customEndDate) params.endDate = customEndDate;
      }
    }

    return params;
  }, [filterStatus, filterTimePeriod, customStartDate, customEndDate, filterUserId, filterOrderId, page, size, sort]);

  // ── Fetch de pedidos ─────────────────────────────────────────────────────────
  const {
    data: ordersPage,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<PageableResponse<OrderResponseDTO>, Error>({
    queryKey: ["orders", filterParams],
    queryFn: async () => (await ordersApi.filter(filterParams)).data,
    placeholderData: (prev) => prev,
  });

  const orders = ordersPage?.content ?? [];
  const totalPages = ordersPage?.totalPages ?? 0;
  const totalElements = ordersPage?.totalElements ?? 0;

  // ── Busca textual no front (sobre os itens da página atual) ──────────────────
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.userEmail?.toLowerCase().includes(term) ||
        o.id?.toString().includes(term)
    );
  }, [orders, searchTerm]);

  // ── Contagem por status (sobre a página atual) ───────────────────────────────
  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.orderStatus === status).length;

  // ── Filtros ativos ───────────────────────────────────────────────────────────
  const hasActiveFilters =
    filterStatus !== "ALL" ||
    filterTimePeriod !== "ALL" ||
    filterUserId !== "ALL" ||
    !!filterOrderId ||
    !!searchTerm;

  const clearAllFilters = () => {
    setFilterStatus("ALL");
    setFilterTimePeriod("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setFilterUserId("ALL");
    setFilterOrderId("");
    setSearchTerm("");
    setPage(0);
  };

  // ── Modais ───────────────────────────────────────────────────────────────────
  const openDetailsModal = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  // ── Mutation de status ───────────────────────────────────────────────────────
  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; newStatus: OrderStatus }) =>
      ordersApi.updateOrderStatus(data.orderId, data.newStatus),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Status do pedido atualizado." });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      closeDetailsModal();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status.",
        variant: "destructive",
      });
    },
  });

  // ── Loading / Error states ───────────────────────────────────────────────────
  if (isLoadingOrders || isLoadingUsers) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
          <p className="text-stone-500 text-sm font-medium">
            Carregando pedidos...
          </p>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-xl font-serif font-bold text-red-700">
            Erro ao carregar pedidos
          </h1>
          <p className="text-stone-500 text-sm">Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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
              Gestão de Pedidos
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {totalElements > 0
                ? `${totalElements} pedidos encontrados`
                : "Nenhum pedido no período"}
            </p>
          </div>
          <Button variant="outline" className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-50">
            <FileText className="w-4 h-4" />
            Relatório de Vendas
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
            <button
              key={m.status}
              onClick={() =>
                setFilterStatus(
                  filterStatus === m.status ? "ALL" : m.status
                )
              }
              className={cn(
                "rounded-2xl border p-4 flex flex-col gap-2 text-left transition-all hover:shadow-md",
                m.bgClass,
                filterStatus === m.status && "ring-2 ring-offset-1 ring-stone-400"
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.iconBg)}>
                <span className={m.colorClass}>{m.icon}</span>
              </div>
              <div>
                <p className={cn("text-2xl font-black", m.colorClass)}>
                  {countByStatus(m.status)}
                </p>
                <p className={cn("text-xs font-semibold mt-0.5", m.colorClass, "opacity-80")}>
                  {m.label}
                </p>
              </div>
            </button>
          ))}
        </motion.div>

        {/* ── Filtros de Período ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-4 shadow-sm"
        >
          {/* Header da seção */}
          <div className="flex items-center gap-2">
            <div className="bg-stone-100 p-1.5 rounded-lg">
              <Calendar className="h-4 w-4 text-stone-600" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-stone-500">
              Período
            </h2>
          </div>

          {/* Botões de período */}
          <div className="flex flex-wrap gap-2">
            {TIME_PERIOD_CONFIG.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setFilterTimePeriod(p.value);
                  setPage(0);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  filterTimePeriod === p.value
                    ? "bg-stone-800 text-amber-50 border-stone-800 shadow-sm"
                    : "bg-background border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Datas personalizadas */}
          <AnimatePresence>
            {filterTimePeriod === TimePeriod.CUSTOM && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-stone-500">
                    Data inicial
                  </Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-stone-500">
                    Data final
                  </Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Filtros de Status + Busca ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-4"
        >
          {/* Linha: status + busca */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-stone-500">
                Status do Pedido
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTER_CONFIG.map((f) => {
                  const isActive = filterStatus === f.value;
                  const count =
                    f.value === "ALL"
                      ? orders.length
                      : countByStatus(f.value as OrderStatus);
                  return (
                    <button
                      key={f.value}
                      onClick={() => {
                        setFilterStatus(f.value);
                        setPage(0);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
                        isActive
                          ? f.activeClass + " shadow-sm"
                          : "bg-background border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                      )}
                    >
                      {f.icon}
                      <span className="hidden sm:inline">{f.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                          isActive
                            ? "bg-white/20 text-white"
                            : f.badgeClass
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Busca textual */}
            <div className="relative shrink-0">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por e-mail ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Filtros secundários: usuário + ID do pedido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1">
                <Users className="h-3 w-3" /> Filtrar por Usuário
              </Label>
              <Select
                value={filterUserId}
                onValueChange={(v) => { setFilterUserId(v); setPage(0); }}
              >
                <SelectTrigger className="rounded-xl border-stone-200 bg-background text-foreground">
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent className="bg-card border-stone-200">
                  <SelectItem value="ALL">Todos os usuários</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Buscar por ID do Pedido
              </Label>
              <Input
                type="number"
                placeholder="Ex: 1042"
                value={filterOrderId}
                onChange={(e) => { setFilterOrderId(e.target.value); setPage(0); }}
                className="rounded-xl border-stone-200 bg-background focus:ring-stone-300"
              />
            </div>

            {/* Botão limpar filtros */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-background px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>

          {/* Badge de filtros ativos */}
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
                  <span className="font-black text-foreground">
                    {filteredOrders.length}
                  </span>{" "}
                  {filteredOrders.length === 1 ? "pedido" : "pedidos"}
                </span>

                {filterStatus !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {STATUS_FILTER_CONFIG.find((f) => f.value === filterStatus)?.label}
                    <button
                      onClick={() => setFilterStatus("ALL")}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filterTimePeriod !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {TIME_PERIOD_CONFIG.find((p) => p.value === filterTimePeriod)?.label}
                    <button
                      onClick={() => setFilterTimePeriod("ALL")}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filterUserId !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    {users?.find((u) => String(u.id) === filterUserId)?.name ?? "Usuário"}
                    <button
                      onClick={() => setFilterUserId("ALL")}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filterOrderId && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold">
                    Pedido #{filterOrderId}
                    <button
                      onClick={() => setFilterOrderId("")}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Tabela / Estado vazio ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
        >
          {filteredOrders.length > 0 ? (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-stone-50/80 text-left">
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Pedido
                      </th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Data
                      </th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Pagamento
                      </th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Total
                      </th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-stone-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredOrders.map((order) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-black text-stone-700 text-sm">
                            #{order.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                          {order.userEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                          {new Date(order.orderDate).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-stone-500">
                            {order.paymentMethod === PaymentMethod.PIX
                              ? "PIX"
                              : order.paymentMethod === PaymentMethod.CREDIT_CARD
                              ? "Cartão de Crédito"
                              : "Cartão de Débito"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-foreground">
                            {formatCurrency(order.totalPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                              STATUS_STYLE_MAP[order.orderStatus]
                            )}
                          >
                            {order.orderStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openDetailsModal(order)}
                              className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDetailsModal(order)}
                              className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-border/50">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-stone-500">
                          #{order.id}
                        </span>
                        <p className="font-semibold text-foreground text-sm mt-0.5">
                          {order.userEmail}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(order.orderDate).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0",
                          STATUS_STYLE_MAP[order.orderStatus]
                        )}
                      >
                        {order.orderStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="font-black text-foreground">
                        {formatCurrency(order.totalPrice)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openDetailsModal(order)}
                          className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDetailsModal(order)}
                          className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3 text-stone-400">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 opacity-50" />
                </div>
                <p className="font-serif text-lg font-semibold text-stone-500">
                  Nenhum pedido encontrado
                </p>
                <p className="text-xs">
                  {hasActiveFilters
                    ? "Tente remover ou combinar filtros diferentes."
                    : "Não há pedidos para o período selecionado."}
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Página <span className="font-bold">{page + 1}</span> de{" "}
                <span className="font-bold">{totalPages}</span>
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeDetailsModal}
          order={selectedOrder}
          onUpdateStatus={updateOrderStatusMutation.mutate}
          isUpdatingStatus={updateOrderStatusMutation.isPending}
        />
      )}
    </div>
  );
}