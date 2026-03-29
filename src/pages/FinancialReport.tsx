// src/pages/FinancialReport.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Tag,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertCircle,
  Award,
  Hash,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import { financialReportsApi, categoriesApi, productsApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  TimePeriod,
  FinancialReportResponseDTO,
  CategoryResponseDTO,
  ProductResponseDTO,
} from "@/types";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * O Jackson serializa Map.Entry<String, BigDecimal/Integer> como:
 *   { "key": "Nome Produto", "value": 29.90 }
 *
 * Mas BigDecimal pode chegar como string em alguns contextos.
 * Esta função normaliza qualquer forma que o backend retorne.
 */
interface NormalizedTopItem {
  key: string;
  value: number;
}

function normalizeTopItems(raw: unknown[]): NormalizedTopItem[] {
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;

    // nome: campo "key" do Map.Entry
    const key =
      typeof obj.key === "string"
        ? obj.key
        : String(obj.key ?? obj.name ?? obj.productName ?? "—");

    // valor: campo "value" do Map.Entry — pode vir como number ou string
    const rawValue = obj.value ?? obj.revenue ?? obj.totalRevenue ?? obj.quantity ?? 0;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);

    return { key, value: isNaN(value) ? 0 : value };
  });
}

// ─── Configuração de Períodos ─────────────────────────────────────────────────

const PERIOD_CONFIG: { value: TimePeriod | "CUSTOM"; label: string }[] = [
  { value: TimePeriod.TODAY,      label: "Hoje"           },
  { value: TimePeriod.THIS_WEEK,  label: "Esta semana"    },
  { value: TimePeriod.THIS_MONTH, label: "Este mês"       },
  { value: "CUSTOM",              label: "Personalizado"  },
];

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}> = ({ label, value, sub, icon: Icon, accent, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 hover:shadow-md transition-shadow duration-200"
  >
    <div className={cn("p-2.5 rounded-xl shrink-0 self-center sm:self-start", accent)}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1 text-center sm:text-left">
      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-0.5 truncate">
        {label}
      </p>
      {/* AJUSTE: Adicionado 'truncate' e 'title' para evitar quebra de linha no valor */}
      <p
        className="text-xl sm:text-2xl font-bold font-serif text-foreground leading-none truncate"
        title={String(value)}
      >
        {value}
      </p>
      {sub && (
        <p className={cn(
          "text-xs mt-1 flex items-center justify-center sm:justify-start gap-1 truncate",
          trend === "up"   && "text-emerald-600",
          trend === "down" && "text-red-500",
          !trend           && "text-muted-foreground"
        )}>
          {trend === "up"   && <TrendingUp  className="h-3 w-3 shrink-0" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 shrink-0" />}
          <span className="truncate">{sub}</span>
        </p>
      )}
    </div>
  </motion.div>
);

const RankRow: React.FC<{
  rank: number;
  label: string;
  value: number;
  max: number;
  mode: "currency" | "quantity";
}> = ({ rank, label, value, max, mode }) => {
  // Coerção defensiva final — garante que nunca chega NaN no formatCurrency
  const safeValue = isNaN(value) || value == null ? 0 : value;
  const safeMax   = isNaN(max)   || max   <= 0    ? 1 : max;
  const pct       = (safeValue / safeMax) * 100;

  return (
    <div className="flex items-center gap-3 group">
      <div className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
        rank === 1 && "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
        rank === 2 && "bg-stone-100 text-stone-600 ring-1 ring-stone-300",
        rank === 3 && "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
        rank >  3  && "bg-muted text-muted-foreground"
      )}>
        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{label}</p>
          {/* AJUSTE: Adicionado 'whitespace-nowrap' para garantir que o valor não quebre */}
          <p className="text-sm font-bold text-foreground font-mono shrink-0 whitespace-nowrap">
            {mode === "currency" ? formatCurrency(safeValue) : `${safeValue}×`}
          </p>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              rank === 1 && "bg-amber-400",
              rank === 2 && "bg-stone-400",
              rank === 3 && "bg-orange-300",
              rank >  3  && "bg-primary/40"
            )}
          />
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}> = ({ title, icon: Icon, children, defaultOpen = true, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-base sm:text-lg font-bold text-foreground">{title}</h2>
          {badge !== undefined && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp   className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-border/40">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 animate-pulse">
    <div className="h-10 w-10 rounded-xl bg-muted shrink-0 self-center sm:self-start" />
    <div className="flex-1 space-y-2 text-center sm:text-left">
      <div className="h-3 w-24 bg-muted rounded mx-auto sm:mx-0" />
      <div className="h-7 w-32 bg-muted rounded mx-auto sm:mx-0" />
    </div>
  </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function FinancialReport() {
  // ── Período ───────────────────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | "CUSTOM">(
    TimePeriod.THIS_MONTH
  );
  const [customStart, setCustomStart] = useState(getTodayStr());
  const [customEnd,   setCustomEnd]   = useState(getTodayStr());
  const isCustom = selectedPeriod === "CUSTOM";

  const effectiveStart = isCustom ? customStart : undefined;
  const effectiveEnd   = isCustom ? customEnd   : undefined;
  const effectivePeriod: TimePeriod | undefined = isCustom
    ? TimePeriod.CUSTOM
    : selectedPeriod;

  // ── Filtros ───────────────────────────────────────────────────────
  const [productSearch,       setProductSearch]       = useState("");
  const [selectedProduct,     setSelectedProduct]     = useState<ProductResponseDTO | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedCategory,    setSelectedCategory]    = useState<CategoryResponseDTO | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────

  // 1. Sumário financeiro
  const { data: report, isLoading: loadingReport, error: reportError } =
    useQuery<FinancialReportResponseDTO, Error>({
      queryKey: ["financialReport", effectivePeriod, effectiveStart, effectiveEnd],
      queryFn: async () =>
        (await financialReportsApi.getFinancialSummary(effectivePeriod, effectiveStart, effectiveEnd)).data,
      staleTime: 5 * 60 * 1000,
    });

  // 2. Top 5 por receita — tipado como unknown[] para normalizar depois
  const { data: topByRevenueRaw, isLoading: loadingTopRevenue } =
    useQuery<unknown[], Error>({
      queryKey: ["topRevenue", effectivePeriod, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getTopNProductsByRevenue(
          5,
          effectiveStart ?? today,
          effectiveEnd   ?? today
        );
        // O axios já deserializa; garantimos que é array
        return Array.isArray(res.data) ? res.data : [];
      },
      enabled: !isCustom || (!!customStart && !!customEnd),
      staleTime: 5 * 60 * 1000,
    });

  // 3. Top 5 por quantidade — idem
  const { data: topByQtyRaw, isLoading: loadingTopQty } =
    useQuery<unknown[], Error>({
      queryKey: ["topQty", effectivePeriod, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getTopNProductsByQuantitySold(
          5,
          effectiveStart ?? today,
          effectiveEnd   ?? today
        );
        return Array.isArray(res.data) ? res.data : [];
      },
      enabled: !isCustom || (!!customStart && !!customEnd),
      staleTime: 5 * 60 * 1000,
    });

  // Normaliza os dados crus → { key: string, value: number } garantido
  const topByRevenue = useMemo(
    () => normalizeTopItems(topByRevenueRaw ?? []),
    [topByRevenueRaw]
  );

  const topByQty = useMemo(
    () => normalizeTopItems(topByQtyRaw ?? []),
    [topByQtyRaw]
  );

  // 4. Categorias
  const { data: categories } = useQuery<CategoryResponseDTO[], Error>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
    staleTime: 10 * 60 * 1000,
  });

  // 5. Produtos
  const { data: products } = useQuery<ProductResponseDTO[], Error>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
    staleTime: 10 * 60 * 1000,
  });

  // 6. Receita de categoria específica
  const { data: categoryRevenue, isLoading: loadingCatRevenue } =
    useQuery<number, Error>({
      queryKey: ["categoryRevenue", selectedCategory?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getCategoryRevenueByPeriod(
          selectedCategory!.id,
          effectiveStart ?? today,
          effectiveEnd   ?? today
        );
        // BigDecimal pode chegar como string
        return Number(res.data);
      },
      enabled: !!selectedCategory,
      staleTime: 5 * 60 * 1000,
    });

  // 7. Quantidade de categoria
  const { data: categoryQty, isLoading: loadingCatQty } =
    useQuery<number, Error>({
      queryKey: ["categoryQty", selectedCategory?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getCategoryQuantitySoldByPeriod(
          selectedCategory!.id,
          effectiveStart ?? today,
          effectiveEnd   ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedCategory,
      staleTime: 5 * 60 * 1000,
    });

  // 8. Receita de produto específico
  const { data: productRevenue, isLoading: loadingProdRevenue } =
    useQuery<number, Error>({
      queryKey: ["productRevenue", selectedProduct?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getProductRevenueByPeriod(
          selectedProduct!.id,
          effectiveStart ?? today,
          effectiveEnd   ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedProduct,
      staleTime: 5 * 60 * 1000,
    });

  // 9. Quantidade de produto específico
  const { data: productQty, isLoading: loadingProdQty } =
    useQuery<number, Error>({
      queryKey: ["productQty", selectedProduct?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getProductQuantitySoldByPeriod(
          selectedProduct!.id,
          effectiveStart ?? today,
          effectiveEnd   ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedProduct,
      staleTime: 5 * 60 * 1000,
    });

  // ── Produtos filtrados ────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!products || !productSearch.trim()) return products ?? [];
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  // ── Métricas derivadas ────────────────────────────────────────────
  const profitMargin = report && report.totalRevenue > 0
    ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1)
    : "0";

  const revenueByCategory = useMemo(
    () => report ? Object.entries(report.revenueByCategory).sort(([, a], [, b]) => b - a) : [],
    [report]
  );

  const revenueByPayment = useMemo(
    () => report ? Object.entries(report.revenueByPaymentMethod).sort(([, a], [, b]) => b - a) : [],
    [report]
  );

  const maxCatRevenue = revenueByCategory[0]?.[1] ?? 1;
  const maxTopRevenue = topByRevenue[0]?.value     ?? 1;
  const maxTopQty     = topByQty[0]?.value         ?? 1;
  const maxPayRevenue = revenueByPayment[0]?.[1]   ?? 1;

  // ── Erro ──────────────────────────────────────────────────────────
  if (reportError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="font-serif text-xl font-bold text-foreground">Erro ao carregar relatório</p>
          <p className="text-sm text-muted-foreground">Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

        {/* ── Cabeçalho ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Painel Administrativo
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Relatórios Financeiros
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </motion.div>

        {/* ── Seletor de Período ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Período de Análise
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERIOD_CONFIG.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  selectedPeriod === p.value
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isCustom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Data Inicial</Label>
                    <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-xl bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Data Final</Label>
                    <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-xl bg-background" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Visualizando:</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full">
              {PERIOD_CONFIG.find((p) => p.value === selectedPeriod)?.label}
              {isCustom && customStart && customEnd && (
                <span className="text-muted-foreground"> — {customStart} → {customEnd}</span>
              )}
            </span>
          </div>
        </motion.div>

        {/* ── Cards de Métricas ──────────────────────────────────────── */}
        {loadingReport ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : report ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-3 md:gap-4">
            <MetricCard label="Receita Total"   value={formatCurrency(report.totalRevenue)}  icon={DollarSign}   accent="bg-emerald-500/10 text-emerald-600" trend="up"   delay={0}    />
            <MetricCard label="Despesas"        value={formatCurrency(report.totalExpenses)} icon={TrendingDown} accent="bg-red-500/10 text-red-500"          trend="down" delay={0.04} />
            <MetricCard label="Lucro Líquido"   value={formatCurrency(report.netProfit)}     icon={TrendingUp}   accent={report.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"} trend={report.netProfit >= 0 ? "up" : "down"} sub={`${profitMargin}% de margem`} delay={0.08} />
            <MetricCard label="Total de Pedidos" value={report.totalOrders}                  icon={ShoppingBag}  accent="bg-primary/10 text-primary"                       delay={0.12} />
            <MetricCard label="Concluídos"      value={report.completedOrders}               icon={CheckCircle2} accent="bg-green-500/10 text-green-600"                   delay={0.16} />
            <MetricCard label="Cancelados"      value={report.canceledOrders}                icon={XCircle}      accent="bg-red-500/10 text-red-500"                       delay={0.20} />
            <MetricCard label="Pendentes"       value={report.pendingOrders}                 icon={Clock}        accent="bg-amber-500/10 text-amber-600"                   delay={0.24} />
            <MetricCard label="Em Preparo"      value={report.processingOrders}              icon={RefreshCw}    accent="bg-blue-500/10 text-blue-600"                     delay={0.28} />
          </div>
        ) : null}

        {/* ── Top Produtos ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top por Receita */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <Section title="Top 5 por Receita" icon={Award} badge={topByRevenue.length}>
              {loadingTopRevenue ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Carregando…</span>
                </div>
              ) : topByRevenue.length > 0 ? (
                <div className="space-y-4 pt-3">
                  {topByRevenue.map((item, i) => (
                    <RankRow
                      key={`rev-${i}-${item.key}`}
                      rank={i + 1}
                      label={item.key}
                      value={item.value}
                      max={maxTopRevenue}
                      mode="currency"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período.</p>
              )}
            </Section>
          </motion.div>

          {/* Top por Quantidade */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }}>
            <Section title="Top 5 por Qtd. Vendida" icon={Hash} badge={topByQty.length}>
              {loadingTopQty ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Carregando…</span>
                </div>
              ) : topByQty.length > 0 ? (
                <div className="space-y-4 pt-3">
                  {topByQty.map((item, i) => (
                    <RankRow
                      key={`qty-${i}-${item.key}`}
                      rank={i + 1}
                      label={item.key}
                      value={item.value}
                      max={maxTopQty}
                      mode="quantity"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período.</p>
              )}
            </Section>
          </motion.div>
        </div>

        {/* ── Receita por Categoria ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
          <Section title="Receita por Categoria" icon={Tag} badge={revenueByCategory.length}>
            {loadingReport ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : revenueByCategory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-3">
                {revenueByCategory.map(([name, value], i) => (
                  <RankRow key={name} rank={i + 1} label={name} value={value} max={maxCatRevenue} mode="currency" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados de categorias para o período.</p>
            )}
          </Section>
        </motion.div>

        {/* ── Receita por Pagamento ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.22 }}>
          <Section title="Receita por Pagamento" icon={CreditCard} badge={revenueByPayment.length}>
            {loadingReport ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : revenueByPayment.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-3">
                {revenueByPayment.map(([method, value], i) => (
                  <RankRow key={method} rank={i + 1} label={method.replace(/_/g, " ")} value={value} max={maxPayRevenue} mode="currency" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados de pagamento para o período.</p>
            )}
          </Section>
        </motion.div>

        {/* ── Análise por Categoria Específica ──────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.26 }}>
          <Section title="Análise de Categoria" icon={Tag} defaultOpen={false}>
            <div className="pt-3 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Selecionar Categoria
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        selectedCategory?.id === cat.id
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Receita</p>
                          <p className="text-[11px] text-muted-foreground truncate">{selectedCategory.name}</p>
                        </div>
                      </div>
                      {loadingCatRevenue ? (
                        <div className="h-8 w-28 bg-muted rounded animate-pulse" />
                      ) : (
                        /* AJUSTE: Adicionado 'truncate' e 'title' */
                        <p 
                          className="text-2xl font-bold font-serif text-foreground truncate"
                          title={categoryRevenue !== undefined ? formatCurrency(categoryRevenue) : ""}
                        >
                          {categoryRevenue !== undefined && !isNaN(categoryRevenue)
                            ? formatCurrency(categoryRevenue)
                            : "—"}
                        </p>
                      )}
                    </div>

                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Hash className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Qtd. Vendida</p>
                          <p className="text-[11px] text-muted-foreground truncate">{selectedCategory.name}</p>
                        </div>
                      </div>
                      {loadingCatQty ? (
                        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      ) : (
                        /* AJUSTE: Adicionado 'truncate' */
                        <p className="text-2xl font-bold font-serif text-foreground truncate">
                          {categoryQty !== undefined && !isNaN(categoryQty)
                            ? `${categoryQty} un.`
                            : "—"}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedCategory && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Selecione uma categoria acima para ver a análise detalhada.
                </p>
              )}
            </div>
          </Section>
        </motion.div>

        {/* ── Análise por Produto Específico ────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.30 }}>
          <Section title="Análise de Produto" icon={Coffee} defaultOpen={false}>
            <div className="pt-3 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Buscar Produto
                </p>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Nome do produto…"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                      if (selectedProduct && e.target.value !== selectedProduct.name) {
                        setSelectedProduct(null);
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="pl-9 bg-background rounded-xl"
                  />
                  {selectedProduct && (
                    <button
                      onClick={() => { setSelectedProduct(null); setProductSearch(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  <AnimatePresence>
                    {showProductDropdown && productSearch.trim() && !selectedProduct && filteredProducts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto"
                      >
                        {filteredProducts.slice(0, 8).map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => {
                              setSelectedProduct(prod);
                              setProductSearch(prod.name);
                              setShowProductDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{prod.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {prod.category?.name} · {formatCurrency(prod.price)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedProduct && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Analisando:</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full">
                      <Coffee className="h-3 w-3" />
                      {selectedProduct.name}
                      <button onClick={() => { setSelectedProduct(null); setProductSearch(""); }} className="ml-0.5 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 bg-muted/20 border border-border/40 rounded-xl p-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Coffee className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{selectedProduct.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedProduct.category?.name} · Preço unitário: {formatCurrency(selectedProduct.price)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Receita gerada</p>
                        </div>
                        {loadingProdRevenue ? (
                          <div className="h-8 w-28 bg-muted rounded animate-pulse" />
                        ) : (
                          /* AJUSTE: Adicionado 'truncate' e 'title' */
                          <p 
                            className="text-2xl font-bold font-serif text-foreground truncate"
                            title={productRevenue !== undefined ? formatCurrency(productRevenue) : ""}
                          >
                            {productRevenue !== undefined && !isNaN(productRevenue)
                              ? formatCurrency(productRevenue)
                              : "—"}
                          </p>
                        )}
                      </div>

                      <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Hash className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Unidades vendidas</p>
                        </div>
                        {loadingProdQty ? (
                          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                        ) : (
                          /* AJUSTE: Adicionado 'truncate' */
                          <p className="text-2xl font-bold font-serif text-foreground truncate">
                            {productQty !== undefined && !isNaN(productQty)
                              ? `${productQty} un.`
                              : "—"}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedProduct && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Busque e selecione um produto acima para ver sua performance.
                </p>
              )}
            </div>
          </Section>
        </motion.div>

      </div>
    </div>
  );
}