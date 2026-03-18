// src/pages/ExpenseManagement.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Wallet, 
  Plus, 
  Trash2, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Receipt,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  History
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

import { expensesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import type { ExpenseResponseDTO, ExpenseRequestDTO } from "@/types";

export default function ExpenseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { scrollY } = useScroll();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // Efeitos de Scroll (Padrão Home.tsx)
  const headerY = useTransform(scrollY, [0, 500], [0, 150]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const bgTransition = useTransform(
    scrollY,
    [0, 500],
    ["hsl(30, 25%, 97%)", "hsl(32, 28%, 94%)"]
  );

  // Queries - Buscando dados do mês atual
  const { data: expenses, isLoading } = useQuery<ExpenseResponseDTO[]>({
    queryKey: ["expenses", "this-month"],
    queryFn: async () => (await expensesApi.getExpensesForThisMonth()).data,
  });

  // Mutações
  const createMutation = useMutation({
    mutationFn: (data: ExpenseRequestDTO) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setName("");
      setPrice("");
      toast({ title: "Registro concluído", description: "A despesa foi anotada com sucesso." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Registro removido", description: "A entrada foi excluída do livro." });
    },
  });

  const chartData = useMemo(() => {
    if (!expenses) return [];
  
    const groups = expenses.reduce((acc: Record<string, number>, curr) => {
      const date = new Date(curr.date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short' 
      });
      
      acc[date] = (acc[date] || 0) + curr.price;
      return acc;
    }, {});
  
    return Object.keys(groups).map(date => ({ 
      date, 
      amount: groups[date] 
    }));
  }, [expenses]);

  const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.price, 0) || 0;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    createMutation.mutate({ name, price: parseFloat(price) });
  };

  const COLORS = ["#7c2d12", "#a8a29e", "#44403c", "#1c1917"]; // Paleta Old Money

  return (
    <motion.div style={{ backgroundColor: bgTransition }} className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden border-b border-border/30">
      

        <div className="relative z-10 text-center px-4 mt-10">
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="section-label text-primary-foreground mb-4 block"
          >
            Patrimônio & Custos
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-primary-foreground"
          >
            Livro de <span className="italic font-light">Contas.</span>
          </motion.h1>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-24">
        
        {/* DASHBOARD TOP: CHARTS & TOTALS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* TOTAL & INFO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass-card p-8 bg-background/80 backdrop-blur-md border-primary/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-accent rounded-xl text-primary"><Wallet /></div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Monthly Flow</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Despendido</p>
              <h2 className="text-4xl font-serif font-bold text-foreground">{formatCurrency(totalExpenses)}</h2>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-xs border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Média Diária</span>
                <span className="font-bold">{formatCurrency(totalExpenses / 30)}</span>
              </div>
              <div className="flex items-center gap-2 text-destructive text-xs font-bold">
                <TrendingDown className="w-4 h-4" />
                <span>8.2% superior ao mês passado</span>
              </div>
            </div>
          </motion.div>

          {/* BAR CHART: DAILY TREND */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass-card p-8 bg-background/50 border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Tendência de Gastos
              </h3>
              <select className="bg-transparent text-xs font-bold uppercase tracking-tighter outline-none border-none cursor-pointer">
                <option>Últimos 30 dias</option>
                <option>Últimos 7 dias</option>
              </select>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: FORM */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="glass-card p-8 border-border/50 bg-background/50 sticky top-24"
            >
              <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nova Anotação
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Descrição</label>
                  <Input 
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Grãos Arábica Premium" 
                    className="bg-transparent border-border/50 focus:ring-1 focus:ring-primary h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Valor do Investimento</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00" className="pl-10 bg-transparent border-border/50 h-12"
                    />
                  </div>
                </div>
                <Button 
                  disabled={createMutation.isPending}
                  className="w-full h-12 bg-primary hover:shadow-lg transition-all rounded-xl"
                >
                  {createMutation.isPending ? "Processando..." : "Confirmar Registro"}
                </Button>
              </form>
            </motion.div>
          </div>

          {/* RIGHT: LIST */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass-card border-border/50 bg-background/30 overflow-hidden"
            >
              <div className="p-8 border-b border-border/50 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-2xl font-bold flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" /> Histórico
                  </h3>
                  <p className="text-sm text-muted-foreground">Registros de saídas do período atual</p>
                </div>
                <Receipt className="text-muted-foreground/30 w-8 h-8" />
              </div>

              <div className="p-4 md:p-8 space-y-4 max-h-[800px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {expenses?.map((expense, index) => (
                    <motion.div
                      key={expense.id} layout
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }}
                      className="group flex items-center justify-between p-6 rounded-2xl border border-border/40 bg-background/60 hover:bg-background hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{expense.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <span className="font-serif text-xl font-bold text-destructive">
                          -{formatCurrency(expense.price)}
                        </span>
                        <button 
                          onClick={() => deleteMutation.mutate(expense.id)}
                          className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {expenses?.length === 0 && !isLoading && (
                  <div className="py-20 text-center opacity-40 italic">
                    <p className="font-serif">Nenhum registro encontrado no livro.</p>
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