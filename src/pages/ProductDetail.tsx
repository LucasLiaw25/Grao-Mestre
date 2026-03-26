// src/pages/ProductDetail.tsx
import { useState, useEffect } from "react"; // Adicionado useEffect
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ShoppingBag, Minus, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { productsApi, ordersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { type ProductResponseDTO, type PaymentMethod, type OrderResponseDTO, type OrderItemRequestDTO, OrderStatus } from "@/types";
import { useAuth } from "@/hooks/use-auth"; // Importar o hook de autenticação

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth(); // Obter informações do usuário logado
  const [quantity, setQuantity] = useState(1);
  const productId = parseInt(id || "0");

  // Fetch Product Details
  const { data: product, isLoading, error } = useQuery<ProductResponseDTO>({
    queryKey: ["products", productId],
    queryFn: async () => (await productsApi.getById(productId)).data,
    enabled: !!productId,
  });

  // Fetch User's Pending Order (Cart)
  // Este query buscará o pedido do usuário com status PENDING
  const { data: pendingOrder, isLoading: isLoadingPendingOrder } = useQuery<OrderResponseDTO | undefined>({
    queryKey: ["pendingOrder", user?.id],
    queryFn: async () => {
      if (!user?.id) return undefined;
      // Seu endpoint filter já permite buscar por userId e status
      const response = await ordersApi.filter({ userId: user.id, status: OrderStatus.PENDING  });
      // Assumimos que o backend retorna um array, e queremos o primeiro (ou único) pedido PENDING
      return response.data?.content?.[0] || undefined;
    },
    enabled: isAuthenticated && !!user?.id, // Só busca se estiver autenticado e tiver ID de usuário
    staleTime: 5 * 60 * 1000, // 5 minutos de cache para o carrinho
    refetchOnWindowFocus: false, // Não refetch no foco da janela para evitar chamadas excessivas
  });

  // Estado para controlar se está adicionando ao carrinho
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Mutation para criar um novo pedido (se não houver um PENDING)
  const createOrderMutation = useMutation({
    mutationFn: async (item: OrderItemRequestDTO) => {
      const response = await ordersApi.create({
        paymentMethod: "PIX" as PaymentMethod, // Ou outro método padrão
        items: [item],
      });
      return response.data;
    },
    onSuccess: (newOrder) => {
      toast({ title: "Product added!", description: "A new order has been started." });
      queryClient.invalidateQueries({ queryKey: ["pendingOrder", user?.id] }); // Invalida o cache do pedido pendente
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Invalida a lista geral de pedidos (se houver)
      setIsAddingToCart(false);
      // Não redireciona, para o usuário poder continuar adicionando
    },
    onError: (err) => {
      console.error("Error creating order:", err);
      toast({ title: "Error", description: "Failed to start new order. Please try again.", variant: "destructive" });
      setIsAddingToCart(false);
    },
  });

  // Mutation para adicionar/atualizar item em um pedido existente
  const addItemToExistingOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; item: OrderItemRequestDTO }) => {
      const response = await ordersApi.addItemToOrder(data.orderId, data.item);
      return response.data;
    },
    onSuccess: (updatedOrder) => {
      toast({ title: "Product added!", description: "Item added to your existing order." });
      queryClient.invalidateQueries({ queryKey: ["pendingOrder", user?.id] }); // Invalida o cache do pedido pendente
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Invalida a lista geral de pedidos (se houver)
      setIsAddingToCart(false);
    },
    onError: (err) => {
      console.error("Error adding item to order:", err);
      toast({ title: "Error", description: "Failed to add item to order. Please try again.", variant: "destructive" });
      setIsAddingToCart(false);
    },
  });

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated || !user?.id) {
      toast({ title: "Error", description: "Please log in to add products to your cart.", variant: "destructive" });
      navigate("/login"); 
      return;
    }

    setIsAddingToCart(true);
    navigate("/products"); 

    const orderItem: OrderItemRequestDTO = {
      productId: productId,
      quantity: quantity,
    };

    if (pendingOrder) {
      addItemToExistingOrderMutation.mutate({ orderId: pendingOrder.id, item: orderItem });
    } else {
      createOrderMutation.mutate(orderItem);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Product not found</h1>
          <Button onClick={() => navigate("/products")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Products</span>
        </motion.button>

        {isLoading || isLoadingPendingOrder ? ( // Adicionado isLoadingPendingOrder
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />
            <div className="space-y-8">
              <div className="h-12 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
              <div className="space-y-4">
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[4/5] overflow-hidden bg-muted/30 rounded-2xl border border-border/50"
            >
              {product.category && (
                <div className="absolute top-6 left-6 z-10">
                  <span className="px-4 py-2 bg-background/90 backdrop-blur-md text-xs font-semibold text-foreground uppercase tracking-wider rounded-full shadow-sm">
                    {product.category.name}
                  </span>
                </div>
              )}
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col justify-between"
            >
              <div>
                <h1 className="font-serif text-5xl font-bold text-foreground mb-4">{product.name}</h1>
                <p className="text-3xl font-semibold text-primary mb-8">{formatCurrency(product.price)}</p>

                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Description</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 py-8 border-y border-border/50">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">In Stock</p>
                    <p className="text-2xl font-bold text-foreground">
                      {product.storage > 0 ? product.storage : "Out of stock"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Added</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Date(product.registerDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Quantity</span>
                  <div className="flex items-center gap-3 border border-border/50 rounded-lg p-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= product.storage}
                      className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart} // Chama a nova função
                  disabled={product.storage <= 0 || isAddingToCart}
                  size="lg"
                  className="w-full gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {product.storage > 0 ? `${product.storage} items available` : "Out of stock"}
                </p>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}