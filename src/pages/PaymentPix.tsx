// src/pages/PaymentPix.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ordersApi } from "@/lib/api";
import { OrderResponseDTO, PaymentMethod, PaymentStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CheckCircle, Copy, QrCode, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format"; // Assumindo que você tem um formatCurrency
import { Label } from "recharts";

export default function PaymentPix() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [timeLeft, setTimeLeft] = useState<number | null>(null); // Tempo restante em segundos

  // Query para buscar os detalhes do pedido específico
  const { data: order, isLoading, isError, error, refetch } = useQuery<OrderResponseDTO>({
    queryKey: ["orderPixPayment", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("ID do pedido não fornecido.");
      const response = await ordersApi.getMyOrderDetails(Number(orderId));
      return response.data;
    },
    enabled: !!orderId, // Só executa a query se orderId existir
    refetchInterval: 10000, // Refetch a cada 10 segundos para verificar o status do pagamento
    refetchIntervalInBackground: true, // Continua refetching mesmo se a aba não estiver ativa
  });

  // Efeito para o contador de tempo
  useEffect(() => {
    if (order?.payment?.dateOfExpiration) {
      const expirationTime = new Date(order.payment.dateOfExpiration).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          toast({
            title: "Pagamento Pix Expirado",
            description: "O tempo para realizar o pagamento Pix se esgotou.",
            variant: "destructive",
          });
          // Opcional: redirecionar ou desabilitar ações
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [order?.payment?.dateOfExpiration, toast]);

  useEffect(() => {
    if (order?.payment?.paymentStatus === PaymentStatus.PAID) {
      toast({
        title: "Pagamento Aprovado!",
        description: "Seu pedido foi pago com sucesso. Redirecionando...",
        variant: "success",
      });
      setTimeout(() => navigate(`/orders`), 3000); 
    } else if (order?.payment?.paymentStatus === PaymentStatus.FAILED || order?.payment?.paymentStatus === PaymentStatus.CANCELED) {
        toast({
            title: "Pagamento Falhou/Cancelado",
            description: "O pagamento não pôde ser concluído. Por favor, tente novamente.",
            variant: "destructive",
        });
        setTimeout(() => navigate(`/orders`), 5000); // Redireciona para a página de pedidos após 5 segundos
    }
  }, [order?.payment?.paymentStatus, navigate, toast]);


  const handleCopyPixCode = () => {
    if (order?.payment?.qrCodeText) {
      navigator.clipboard.writeText(order.payment.qrCodeText);
      toast({
        title: "Código Pix Copiado!",
        description: "O código foi copiado para a sua área de transferência.",
      });
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando detalhes do pagamento...</p>
      </div>
    );
  }

  if (isError || !order || !order.payment || order.payment.paymentMethod !== PaymentMethod.PIX) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <QrCode className="w-20 h-20 text-destructive mb-6" />
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Erro ao Carregar Pagamento Pix</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {error?.message || "Não foi possível encontrar os detalhes do pagamento Pix para este pedido ou o método de pagamento não é Pix."}
        </p>
        <Button onClick={() => navigate("/orders")}>Voltar para Meus Pedidos</Button>
      </div>
    );
  }

  const { payment } = order;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 max-w-lg w-full text-center"
      >
        <QrCode className="w-16 h-16 text-primary mx-auto mb-6" />
        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">Pagamento Pix</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Escaneie o QR Code ou use o código "copia e cola" para finalizar seu pedido.
        </p>

        <div className="bg-muted p-4 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground mb-2">Valor Total:</p>
          <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(order.totalPrice)}</p>
        </div>

        {/* QR Code */}
        {payment.qrCodeBase64 ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white p-4 rounded-lg inline-block shadow-lg mb-6"
          >
            <img
              src={`data:image/png;base64,${payment.qrCodeBase64}`}
              alt="QR Code Pix"
              className="w-64 h-64 mx-auto"
            />
          </motion.div>
        ) : (
          <div className="bg-muted p-8 rounded-lg mb-6">
            <p className="text-muted-foreground">QR Code não disponível. Por favor, use o código copia e cola.</p>
          </div>
        )}

        {/* Código Copia e Cola */}
        {payment.qrCodeText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-6"
          >
            <label htmlFor="pix-code" className="block text-sm font-medium text-muted-foreground mb-2">
                Código Pix (Copia e Cola)
            </label>
            <div className="relative flex items-center">
              <input
                id="pix-code"
                type="text"
                readOnly
                value={payment.qrCodeText}
                className="flex-grow p-3 pr-12 rounded-lg border border-border bg-input text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyPixCode}
                className="absolute right-2 text-muted-foreground hover:text-primary"
                aria-label="Copiar código Pix"
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tempo de Expiração */}
        {payment.dateOfExpiration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-8"
          >
            <Clock className="h-4 w-4" />
            <span>Expira em: {formatTime(timeLeft)}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Button onClick={() => navigate("/orders")} className="w-full">
            Voltar para Meus Pedidos
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}