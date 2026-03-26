// src/pages/Orders.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { Package, Clock, ShoppingBag, CreditCard, QrCode } from "lucide-react";
import { OrderResponseDTO, OrderStatus, PaymentMethod, PageableResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-200 text-emerald-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SENDED: "bg-purple-100 text-stone-700",
  CANCELED: "bg-red-100 text-red-700",
};

export default function Orders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(undefined);

  // Estados da Paginação do Histórico
  const [page, setPage] = useState(0);
  const [size] = useState(5);

  // Query: Pedido Pendente (Checkout Atual)
  const { data: pendingOrder, isLoading: isLoadingPendingOrder } = useQuery<OrderResponseDTO | undefined>({
    queryKey: ["pendingOrder"],
    queryFn: async () => {
      const response = await ordersApi.getMyOrdersByStatus("PENDING" as OrderStatus);
      return response.data.length > 0 ? response.data[0] : undefined;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Query: Histórico de Pedidos Paginado
  const { data: ordersPage, isLoading: isLoadingOrderHistory } = useQuery<PageableResponse<OrderResponseDTO>>({
    queryKey: ["orderHistory", page],
    queryFn: async () => {
      const response = await ordersApi.getMyOrderHistory({ page, size });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const orderHistory = ordersPage?.content || [];
  const totalPages = ordersPage?.totalPages || 0;

  // Mutation: Finalizar Pagamento
  const finalizeOrderMutation = useMutation({
    mutationFn: (orderId: number) =>
      ordersApi.finalizePayment(orderId, selectedMethod!),
    onSuccess: (response) => {
      const checkoutUrl = response.data.payment?.paymentUrl;

      if (checkoutUrl) {
        toast({
          title: "Pedido Gerado!",
          description: "Redirecionando para o ambiente de pagamento...",
        });
        window.location.href = checkoutUrl;
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível gerar o link de pagamento. Verifique o console.",
          variant: "destructive",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Checkout",
        description: error.response?.data?.message || "Não foi possível finalizar o pedido.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* 1. SEÇÃO DE CHECKOUT (Pedido Pendente) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" /> Carrinho Atual
            </h2>

            {isLoadingPendingOrder ? (
              <div className="h-40 bg-muted animate-pulse rounded-xl" />
            ) : pendingOrder && pendingOrder.items.length > 0 ? (
              <div className="space-y-6">
                <div className="divide-y divide-border/50">
                  {pendingOrder.items.map((item) => (
                    <div key={item.id} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity} x {formatCurrency(item.priceAtTime)}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-border/50 pt-4">
                  <span className="text-lg font-medium text-foreground">Total:</span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(pendingOrder.totalPrice)}
                  </span>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-medium text-foreground">Método de Pagamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedMethod("PIX" as PaymentMethod)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                        selectedMethod === "PIX"
                          ? "border-primary bg-primary/5"
                          : "border-border/50 bg-background hover:border-primary/50"
                      )}
                    >
                      <QrCode className="w-6 h-6" />
                      <span className="text-sm font-medium">PIX</span>
                    </button>
                    <button
                      onClick={() => setSelectedMethod("CREDIT_CARD" as PaymentMethod)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                        selectedMethod === "CREDIT_CARD"
                          ? "border-primary bg-primary/5"
                          : "border-border/50 bg-background hover:border-primary/50"
                      )}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-sm font-medium">Cartão</span>
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg font-medium rounded-xl mt-4"
                  disabled={!selectedMethod || finalizeOrderMutation.isPending}
                  onClick={() => finalizeOrderMutation.mutate(pendingOrder.id)}
                >
                  {finalizeOrderMutation.isPending ? "Processando..." : "Finalizar Compra"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Seu carrinho está vazio.</p>
              </div>
            )}
          </motion.div>

          {/* 2. SEÇÃO DE HISTÓRICO DE PEDIDOS (Paginado) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-muted-foreground" /> Histórico De Pedidos
            </h2>

            {isLoadingOrderHistory ? (
              [1, 2].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl mb-4" />
              ))
            ) : orderHistory && orderHistory.length > 0 ? (
              <div className="space-y-6">
                {orderHistory.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-border/50 rounded-xl p-4 bg-background"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[order.orderStatus] || "bg-muted text-muted-foreground"}`}>
                          {order.orderStatus}
                        </span>
                        <span className="text-lg font-bold text-foreground">{formatCurrency(order.totalPrice)}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/30 pt-3 space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-foreground">{item.productName} × {item.quantity}</span>
                          <span className="text-muted-foreground">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Componente de Paginação */}
                {totalPages > 1 && (
                  <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Página <span className="font-bold text-foreground">{page + 1}</span> de{" "}
                      <span className="font-bold text-foreground">{totalPages}</span>
                    </p>
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <p className="text-xl text-muted-foreground font-serif">No past orders found.</p>
              </div>
            )}
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
}