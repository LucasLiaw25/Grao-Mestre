// src/pages/ExpenseManagement.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Wallet, Plus, Trash2, TrendingDown, Calendar, DollarSign, 
  Receipt, ArrowUpRight, BarChart3, History, Edit3, X, Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from "recharts";

import { expensesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type ExpenseResponseDTO, type ExpenseRequestDTO, TimePeriod } from "@/types";

type FilterType = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom' | 'all';

export default function ExpenseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { scrollY } = useScroll();
  
  // Estados do Formulário
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estados de Filtro
  const [filter, setFilter] = useState<FilterType>("this-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Ajuste de Layout: Hero menor para subir o conteúdo
  const bgTransition = useTransform(scrollY, [0, 500], ["hsl(30, 25%, 97%)", "hsl(32, 28%, 94%)"]);

  // --- QUERIES ---
  const { data: expenses, isLoading } = useQuery<ExpenseResponseDTO[]>({
    queryKey: ["expenses", filter, startDate, endDate],
    queryFn: async () => {
      switch (filter) {
        case 'today': return (await expensesApi.getExpensesForToday()).data;
        case 'yesterday': return (await expensesApi.getExpensesForYesterday()).data;
        case 'this-week': return (await expensesApi.getExpensesForThisWeek()).data;
        case 'last-week': return (await expensesApi.getExpensesForLastWeek()).data;
        case 'this-month': return (await expensesApi.getExpensesForThisMonth()).data;
        case 'last-month': return (await expensesApi.getExpensesForLastMonth()).data;
        case 'all': return (await expensesApi.getAll()).data;
        case 'custom': 
          return (await expensesApi.getExpensesByPeriod(TimePeriod.CUSTOM , startDate, endDate)).data;
        default: return (await expensesApi.getExpensesForThisMonth()).data;
      }
    },
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (data: ExpenseRequestDTO) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      resetForm();
      toast({ title: "Sucesso", description: "Despesa registrada no livro." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ExpenseRequestDTO }) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      resetForm();
      toast({ title: "Atualizado", description: "O registro foi devidamente alterado." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Removido", description: "Entrada excluída com sucesso." });
    },
  });

  // --- HANDLERS ---
  const resetForm = () => {
    setName("");
    setPrice("");
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    const payload = { name, price: parseFloat(price) };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (expense: ExpenseResponseDTO) => {
    setEditingId(expense.id);
    setName(expense.name);
    setPrice(expense.price.toString());
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const chartData = useMemo(() => {
    if (!expenses) return [];
    const groups = expenses.reduce((acc: Record<string, number>, curr) => {
      const date = new Date(curr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      acc[date] = (acc[date] || 0) + curr.price;
      return acc;
    }, {});
    return Object.entries(groups).map(([date, amount]) => ({ date, amount }));
  }, [expenses]);

  const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.price, 0) || 0;

  return (
    <motion.div style={{ backgroundColor: bgTransition }} className="min-h-screen">
      {/* HERO SECTION - Reduzida para subir o conteúdo (h-[35vh]) */}
      <section className="relative h-[35vh] flex items-center justify-center overflow-hidden border-b border-border/30 ">
        <div className="relative z-10 text-center px-4 mt-5">
         
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-24">
        
        {/* CONTROLES DE FILTRO */}
        <div className="glass-card mb-8 p-4 bg-background/60 flex flex-wrap items-center justify-between gap-4 border-primary/5">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            {(['today', 'this-week', 'this-month', 'all', 'custom'] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  filter === t ? "bg-primary text-white shadow-md" : "hover:bg-accent text-muted-foreground"
                }`}
              >
                {t === 'today' ? 'Hoje' : t === 'this-week' ? 'Semana' : t === 'this-month' ? 'Mês' : t === 'all' ? 'Tudo' : 'Personalizado'}
              </button>
            ))}
          </div>

          {filter === 'custom' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs bg-transparent" />
              <span className="text-muted-foreground">à</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs bg-transparent" />
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* CARD DE TOTAL */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="glass-card p-8 bg-background/90 border-primary/10 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-accent rounded-xl text-primary"><Wallet /></div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Status Atual</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total no Período</p>
              <h2 className="text-4xl font-serif font-bold text-foreground">{formatCurrency(totalExpenses)}</h2>
            </div>
            <div className="mt-8 pt-6 border-t border-border/50">
               <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-tighter">
                <Calendar className="w-4 h-4" />
                <span>{expenses?.length || 0} Registros encontrados</span>
              </div>
            </div>
          </motion.div>

          {/* GRÁFICO */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-card p-8 bg-background/50 border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Fluxo de Saída
              </h3>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="amount" fill="#7c2d12" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FORMULÁRIO (ADD/EDIT) */}
          <div className="lg:col-span-4">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="glass-card p-8 border-border/50 bg-background/50 sticky top-24 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  {editingId ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5" />}
                  {editingId ? "Editar Registro" : "Nova Anotação"}
                </h3>
                {editingId && (
                  <button onClick={resetForm} className="text-muted-foreground hover:text-primary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Descrição</label>
                  <Input 
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jantar no Fasano" 
                    className="bg-transparent border-border/50 focus:ring-1 focus:ring-primary h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Valor</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00" className="pl-10 bg-transparent border-border/50 h-12"
                    />
                  </div>
                </div>
                <Button 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className={`w-full h-12 transition-all rounded-xl font-bold uppercase tracking-widest text-[10px] ${
                    editingId ? "bg-stone-800 hover:bg-stone-900" : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {createMutation.isPending || updateMutation.isPending ? "Processando..." : editingId ? "Atualizar Livro" : "Confirmar Registro"}
                </Button>
              </form>
            </motion.div>
          </div>

          {/* LISTAGEM HISTÓRICA */}
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="glass-card border-border/50 bg-background/30 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border/50 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-2xl font-bold flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" /> Histórico
                  </h3>
                  <p className="text-sm text-muted-foreground italic">Exibindo registros de: <span className="font-bold text-primary">{filter.replace('-', ' ')}</span></p>
                </div>
                <Receipt className="text-muted-foreground/30 w-8 h-8" />
              </div>

              <div className="p-4 md:p-8 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {expenses?.map((expense) => (
                    <motion.div
                      key={expense.id} layout
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }}
                      className="group flex items-center justify-between p-5 rounded-2xl border border-border/40 bg-background/60 hover:bg-background hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-800">{expense.name}</h4>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                            {new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="font-serif text-lg font-bold text-stone-900">
                          {formatCurrency(expense.price)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(expense)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteMutation.mutate(expense.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {expenses?.length === 0 && !isLoading && (
                  <div className="py-20 text-center opacity-40">
                    <p className="font-serif text-lg italic">Nenhum registro encontrado para este período.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}