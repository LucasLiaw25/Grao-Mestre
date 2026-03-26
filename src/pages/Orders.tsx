// src/pages/Orders.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ordersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { Package, Clock, Minus, Plus, Trash2, ShoppingBag, CheckCircle } from "lucide-react";
import { OrderResponseDTO, OrderStatus, PaymentMethod } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom"; // Para redirecionar após finalizar compra
import React from "react";
import { cn } from "@/lib/utils";

export default function Orders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | undefined>(undefined);

  const { data: pendingOrder, isLoading: isLoadingPendingOrder } = useQuery<OrderResponseDTO | undefined>({
    queryKey: ["pendingOrder"], 
    queryFn: async () => {
      const response = await ordersApi.getMyOrdersByStatus("PENDING" as OrderStatus);
  
      return response.data.length > 0 ? response.data[0] : undefined;
    },
    staleTime: 0, 
    refetchOnWindowFocus: true,
  });

  const { data: orderHistory, isLoading: isLoadingOrderHistory } = useQuery<OrderResponseDTO[]>({
    queryKey: ["orderHistory"],
    queryFn: async () => {
      const response = await ordersApi.getMyOrderHistory();
      const allOrders = response.data;
      return allOrders.filter(order => order.orderStatus !== "PENDING");
    },
    staleTime: 5 * 60 * 1000,
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ orderId, orderItemId }: { orderId: number; orderItemId: number }) =>
      ordersApi.removeItemFromOrder(orderId, orderItemId),
    onSuccess: () => {
      toast({ title: "Item Removed", description: "Product removed from your cart." });
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["orderHistory"] }); // Pode afetar o histórico se o carrinho ficar vazio
    },
    onError: (err) => {
      console.error("Error removing item:", err);
      toast({ title: "Error", description: "Failed to remove item. Please try again.", variant: "destructive" });
    },
  });

  // Mutation para atualizar a quantidade de um item no carrinho
  const updateQuantityMutation = useMutation({
    mutationFn: ({ orderId, orderItemId, quantity }: { orderId: number; orderItemId: number; quantity: number }) =>
      ordersApi.updateOrderItemQuantity(orderId, orderItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      // Não mostra toast para cada mudança de quantidade, para não ser intrusivo
    },
    onError: (err) => {
      console.error("Error updating quantity:", err);
      toast({ title: "Error", description: "Failed to update quantity. Please try again.", variant: "destructive" });
    },
  });

const finalizeOrderMutation = useMutation({
  mutationFn: (orderId: number) =>
    ordersApi.finalizePayment(orderId, selectedMethod!), 
  onSuccess: (response) => {
    const checkoutUrl = response.data.payment.paymentUrl;

    if (checkoutUrl) {
      toast({ 
        title: "Pedido Gerado!", 
        description: "Redirecionando para o ambiente de pagamento...",
        variant: "success",
      });
      window.location.href = checkoutUrl;
    } else {
      toast({ 
        title: "Erro no Checkout", 
        description: "Não foi possível gerar o link de pagamento.",
        variant: "destructive",
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
  },
});

  const handleRemoveItem = (orderId: number, orderItemId: number) => {
    removeItemMutation.mutate({ orderId, orderItemId });
  };

  const handleUpdateQuantity = (orderId: number, orderItemId: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      handleRemoveItem(orderId, orderItemId);
    } else {
      updateQuantityMutation.mutate({ orderId, orderItemId, quantity: newQuantity });
    }
  };

  const handleFinalizeOrder = () => {
    if (pendingOrder && pendingOrder.id) {
      finalizeOrderMutation.mutate(pendingOrder.id);
    } else {
      toast({ title: "Error", description: "No items in your cart to finalize.", variant: "destructive" });
    }
  };

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
    SENDED: "bg-indigo-100 text-indigo-800",
    CANCELED: "bg-red-100 text-red-800",
    RECUSE: "bg-red-100 text-red-800",
  };

  const isLoadingAny = isLoadingPendingOrder || isLoadingOrderHistory;

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-28 pb-12 bg-muted/30 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label">Minha Conta</span>
            <h1 className="section-title">Meus Pedidos</h1>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Carrinho Pendente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" /> Meu Carrinho
            </h2>

            {isLoadingPendingOrder ? (
              <div className="h-24 bg-muted animate-pulse rounded-xl" />
            ) : pendingOrder && pendingOrder.items && pendingOrder.items.length > 0 ? (
              <div className="space-y-4">
                {pendingOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.priceAtTime)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(pendingOrder.id, item.id, item.quantity, -1)}
                        disabled={removeItemMutation.isPending || updateQuantityMutation.isPending}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(pendingOrder.id, item.id, item.quantity, 1)}
                        disabled={removeItemMutation.isPending || updateQuantityMutation.isPending}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(pendingOrder.id, item.id)}
                        disabled={removeItemMutation.isPending || updateQuantityMutation.isPending}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(pendingOrder.totalPrice)}</span>
                </div>
                <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Selecione o Método de Pagamento
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: PaymentMethod.PIX, label: "Pix", icon: "📱" },
                      { id: PaymentMethod.CREDIT_CARD, label: "Cartão de Crédito", icon: "💳" },
                      { id: PaymentMethod.DEBIT_CARD, label: "Cartão de Débito", icon: "🏦" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300",
                          selectedMethod === method.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border/50 hover:border-primary/50 bg-background"
                        )}
                      >
                        <span className="text-2xl mb-2">{method.icon}</span>
                        <span className="text-sm font-semibold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                    onClick={handleFinalizeOrder}
                    disabled={finalizeOrderMutation.isPending || !selectedMethod || pendingOrder?.items?.length === 0}
                    className="w-full mt-6 gap-2"
                    size="lg"
                  >
                    {finalizeOrderMutation.isPending ? (
                      "Processando..."
                    ) : !selectedMethod ? (
                      "Selecione um método para continuar"
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Finalizar Compra com {selectedMethod}
                      </>
                    )}
                  </Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <p className="text-xl text-muted-foreground font-serif">Seu Carrinho Está Vazio.</p>
                <Button onClick={() => navigate("/products")} className="mt-6">
                  Começar as Compras
                </Button>
              </div>
            )}
          </motion.div>

          {/* Histórico de Pedidos */}
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