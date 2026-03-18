// src/pages/ExpenseManagement.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { expensesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExpenseResponseDTO, ExpenseRequestDTO, TimePeriod } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd 'de' MMM, HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

// ─── Configuração de Períodos ─────────────────────────────────────────────────

const PERIOD_CONFIG: {
  value: TimePeriod | "ALL";
  label: string;
  fetcher: () => Promise<{ data: ExpenseResponseDTO[] }>;
}[] = [
  {
    value: "ALL",
    label: "Todos",
    fetcher: () => expensesApi.getAll(),
  },
  {
    value: TimePeriod.TODAY,
    label: "Hoje",
    fetcher: () => expensesApi.getExpensesForToday(),
  },
  {
    value: TimePeriod.YESTERDAY,
    label: "Ontem",
    fetcher: () => expensesApi.getExpensesForYesterday(),
  },
  {
    value: TimePeriod.THIS_WEEK,
    label: "Esta semana",
    fetcher: () => expensesApi.getExpensesForThisWeek(),
  },
  {
    value: TimePeriod.LAST_WEEK,
    label: "Semana passada",
    fetcher: () => expensesApi.getExpensesForLastWeek(),
  },
  {
    value: TimePeriod.THIS_MONTH,
    label: "Este mês",
    fetcher: () => expensesApi.getExpensesForThisMonth(),
  },
  {
    value: TimePeriod.LAST_MONTH,
    label: "Mês passado",
    fetcher: () => expensesApi.getExpensesForLastMonth(),
  },
  {
    value: TimePeriod.CUSTOM,
    label: "Personalizado",
    fetcher: () => expensesApi.getAll(), // sobrescrito abaixo
  },
];

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: ExpenseResponseDTO | null;
  onSubmit: (data: ExpenseRequestDTO) => void;
  isSubmitting: boolean;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onSubmit,
  isSubmitting,
}) => {
  const isEditing = !!expense;
  const [name, setName] = useState(expense?.name ?? "");
  const [price, setPrice] = useState(expense ? String(expense.price) : "");

  // Sincroniza campos ao abrir para edição
  React.useEffect(() => {
    setName(expense?.name ?? "");
    setPrice(expense ? String(expense.price) : "");
  }, [expense, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    onSubmit({ name: name.trim(), price: parseFloat(price) });
  };

  const isValid = name.trim().length > 0 && parseFloat(price) > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Painel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <Receipt className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">
                {isEditing ? "Editar Despesa" : "Nova Despesa"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Altere os dados da despesa"
                  : "Registre uma nova despesa"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Descrição
            </Label>
            <Input
              placeholder="Ex: Fornecedor de grãos, energia elétrica…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-background"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Valor (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-xl bg-background pl-9"
              />
            </div>
          </div>

          {/* Preview */}
          {isValid && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-muted/40 border border-border/50 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-xs text-muted-foreground">Resumo</p>
                <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {name}
                </p>
              </div>
              <p className="font-serif text-lg font-bold text-red-500">
                -{formatCurrency(parseFloat(price) || 0)}
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 rounded-xl gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isEditing ? "Salvar" : "Registrar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────

interface DeleteModalProps {
  isOpen: boolean;
  expense: ExpenseResponseDTO | null;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  expense,
  onConfirm,
  onClose,
  isDeleting,
}) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-foreground">
              Excluir despesa
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold text-foreground">
                "{expense.name}"
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 rounded-xl gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-4 border-b border-border/40 animate-pulse">
    <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 w-48 bg-muted rounded" />
      <div className="h-3 w-28 bg-muted rounded" />
    </div>
    <div className="h-5 w-20 bg-muted rounded" />
    <div className="h-7 w-16 bg-muted rounded-lg" />
  </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ExpenseManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Período ───────────────────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | "ALL">(
    TimePeriod.THIS_MONTH
  );
  const [customStart, setCustomStart] = useState(getTodayStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());
  const [showPeriodPanel, setShowPeriodPanel] = useState(false);
  const isCustom = selectedPeriod === TimePeriod.CUSTOM;

  // ── Busca ─────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Modais ────────────────────────────────────────────────────────
  const [expenseModal, setExpenseModal] = useState<{
    open: boolean;
    expense: ExpenseResponseDTO | null;
  }>({ open: false, expense: null });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    expense: ExpenseResponseDTO | null;
  }>({ open: false, expense: null });

  // ── Query de despesas ─────────────────────────────────────────────
  const periodCfg = PERIOD_CONFIG.find((p) => p.value === selectedPeriod)!;

  const {
    data: expenses,
    isLoading,
    isFetching,
  } = useQuery<ExpenseResponseDTO[], Error>({
    queryKey: ["expenses", selectedPeriod, customStart, customEnd],
    queryFn: async () => {
      if (isCustom) {
        return (
          await expensesApi.getExpensesByPeriod(
            TimePeriod.CUSTOM,
            customStart,
            customEnd
          )
        ).data;
      }
      return (await periodCfg.fetcher()).data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // ── Filtro local por busca ─────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!expenses) return [];
    if (!searchTerm.trim()) return expenses;
    const q = searchTerm.toLowerCase();
    return expenses.filter((e) => e.name.toLowerCase().includes(q));
  }, [expenses, searchTerm]);

  // ── Métricas ──────────────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => (expenses ?? []).reduce((sum, e) => sum + e.price, 0),
    [expenses]
  );
  const avgExpense = expenses?.length
    ? totalExpenses / expenses.length
    : 0;
  const maxExpense = expenses?.length
    ? Math.max(...expenses.map((e) => e.price))
    : 0;

  // ── Mutations ─────────────────────────────────────────────────────
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseRequestDTO) => expensesApi.create(data),
    onSuccess: () => {
      toast({ title: "Despesa registrada", description: "Despesa adicionada com sucesso." });
      invalidate();
      setExpenseModal({ open: false, expense: null });
    },
    onError: () =>
      toast({
        title: "Erro",
        description: "Não foi possível registrar a despesa.",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; dto: ExpenseRequestDTO }) =>
      expensesApi.update(data.id, data.dto),
    onSuccess: () => {
      toast({ title: "Despesa atualizada", description: "Alterações salvas com sucesso." });
      invalidate();
      setExpenseModal({ open: false, expense: null });
    },
    onError: () =>
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a despesa.",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Despesa excluída", description: "Despesa removida com sucesso." });
      invalidate();
      setDeleteModal({ open: false, expense: null });
    },
    onError: () =>
      toast({
        title: "Erro",
        description: "Não foi possível excluir a despesa.",
        variant: "destructive",
      }),
  });

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSubmitExpense = (dto: ExpenseRequestDTO) => {
    if (expenseModal.expense) {
      updateMutation.mutate({ id: expenseModal.expense.id, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const periodLabel =
    PERIOD_CONFIG.find((p) => p.value === selectedPeriod)?.label ?? "—";

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

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
              Gestão de Despesas
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

          <Button
            onClick={() => setExpenseModal({ open: true, expense: null })}
            className="gap-2 rounded-xl self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </motion.div>

        {/* ── Métricas ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: "Total",
              value: isLoading ? "—" : formatCurrency(totalExpenses),
              icon: TrendingDown,
              accent: "bg-red-500/10 text-red-500",
              delay: 0,
            },
            {
              label: "Registros",
              value: isLoading ? "—" : expenses?.length ?? 0,
              icon: Receipt,
              accent: "bg-primary/10 text-primary",
              delay: 0.04,
            },
            {
              label: "Ticket médio",
              value: isLoading ? "—" : formatCurrency(avgExpense),
              icon: DollarSign,
              accent: "bg-amber-500/10 text-amber-600",
              delay: 0.08,
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: card.delay }}
              className="bg-card border border-border/60 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div className={cn("p-2.5 rounded-xl shrink-0", card.accent)}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-0.5">
                  {card.label}
                </p>
                <p className="text-2xl font-bold font-serif text-foreground leading-none">
                  {card.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Filtros de Período + Busca ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-4"
        >
          {/* Linha superior: busca + toggle filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar despesa…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={() => setShowPeriodPanel((v) => !v)}
              className={cn(
                "gap-2 rounded-xl shrink-0",
                showPeriodPanel && "border-primary/40 text-primary bg-primary/5"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Período</span>
              <span className="sm:hidden">Filtrar</span>
              {showPeriodPanel ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Painel de período colapsável */}
          <AnimatePresence>
            {showPeriodPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/40 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Período de Visualização
                    </p>
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
                  </div>

                  {/* Datas customizadas */}
                  <AnimatePresence>
                    {isCustom && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">
                              Data Inicial
                            </Label>
                            <Input
                              type="date"
                              value={customStart}
                              onChange={(e) => setCustomStart(e.target.value)}
                              className="rounded-xl bg-background"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">
                              Data Final
                            </Label>
                            <Input
                              type="date"
                              value={customEnd}
                              onChange={(e) => setCustomEnd(e.target.value)}
                              className="rounded-xl bg-background"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chip de período ativo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Exibindo:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full">
              <Calendar className="h-3 w-3" />
              {periodLabel}
              {isCustom && customStart && customEnd && (
                <span className="text-muted-foreground">
                  {" "}— {customStart} → {customEnd}
                </span>
              )}
            </span>
            {isFetching && !isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
        </motion.div>

        {/* ── Lista de Despesas ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden"
        >
          {/* Header da lista */}
          <div className="px-5 sm:px-6 py-4 border-b border-border/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-bold text-foreground">
                Despesas
              </h2>
              {!isLoading && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                  {filtered.length}
                  {expenses && filtered.length !== expenses.length
                    ? ` de ${expenses.length}`
                    : ""}
                </span>
              )}
            </div>

            {/* Maior despesa — info discreta no desktop */}
            {!isLoading && maxExpense > 0 && (
              <p className="hidden sm:block text-xs text-muted-foreground">
                Maior:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(maxExpense)}
                </span>
              </p>
            )}
          </div>

          {/* Conteúdo */}
          {isLoading ? (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-foreground">
                  Nenhuma despesa encontrada
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm
                    ? "Tente outro termo de busca."
                    : "Nenhuma despesa registrada no período."}
                </p>
              </div>
              {!searchTerm && (
                <Button
                  size="sm"
                  onClick={() => setExpenseModal({ open: true, expense: null })}
                  className="rounded-xl gap-2 mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Registrar primeira despesa
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* ── Desktop: tabela ──────────────────────────────── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Descrição", "Data", "Valor", ""].map((h) => (
                        <th
                          key={h}
                          className={cn(
                            "px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                            h === "" ? "text-right" : "text-left"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <AnimatePresence initial={false}>
                      {filtered.map((expense, i) => (
                        <motion.tr
                          key={expense.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="group hover:bg-muted/20 transition-colors"
                        >
                          {/* Descrição */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <Receipt className="h-4 w-4 text-red-500" />
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {expense.name}
                              </span>
                            </div>
                          </td>

                          {/* Data */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(expense.date)}
                            </span>
                          </td>

                          {/* Valor */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold font-mono text-red-500">
                              -{formatCurrency(expense.price)}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  setExpenseModal({
                                    open: true,
                                    expense,
                                  })
                                }
                                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({ open: true, expense })
                                }
                                className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* ── Mobile: cards ─────────────────────────────────── */}
              <div className="sm:hidden divide-y divide-border/40">
                <AnimatePresence initial={false}>
                  {filtered.map((expense, i) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="flex items-center gap-3 px-4 py-4"
                    >
                      {/* Ícone */}
                      <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <Receipt className="h-5 w-5 text-red-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {expense.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(expense.date)}
                        </p>
                      </div>

                      {/* Valor + ações */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold font-mono text-red-500">
                          -{formatCurrency(expense.price)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setExpenseModal({ open: true, expense })
                            }
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({ open: true, expense })
                            }
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all active:scale-95"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Footer com total */}
          {!isLoading && filtered.length > 0 && (
            <div className="px-5 sm:px-6 py-4 border-t border-border/50 flex items-center justify-between gap-4 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1 ? "despesa" : "despesas"} — período:{" "}
                <span className="font-medium text-foreground">{periodLabel}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Total:</span>
                <span className="text-sm font-bold font-serif text-red-500">
                  -{formatCurrency(filtered.reduce((s, e) => s + e.price, 0))}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Modais ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {expenseModal.open && (
          <ExpenseModal
            isOpen={expenseModal.open}
            onClose={() => setExpenseModal({ open: false, expense: null })}
            expense={expenseModal.expense}
            onSubmit={handleSubmitExpense}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.open && (
          <DeleteModal
            isOpen={deleteModal.open}
            expense={deleteModal.expense}
            onConfirm={() => {
              if (deleteModal.expense) {
                deleteMutation.mutate(deleteModal.expense.id);
              }
            }}
            onClose={() => setDeleteModal({ open: false, expense: null })}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}