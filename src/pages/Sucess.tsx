// src/pages/OrderSuccess.tsx
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Coffee, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

export default function OrderSuccess() {
  // O Mercado Pago geralmente envia parâmetros na URL ao redirecionar de volta.
  // Você pode pegar o payment_id para mostrar ao usuário, se desejar.
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* SECTION HEADER SIMILAR AO ORDERS.TSX */}
      <section className="pt-28 pb-12 bg-muted/30 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label mb-4 inline-block">Apreciação</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
              Pedido Confirmado.
            </h1>
          </motion.div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <section className="py-16 flex-grow flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-10 md:p-14 text-center relative overflow-hidden"
          >
            {/* EFEITO DE FUNDO SUTIL */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

            {/* ÍCONE DE SUCESSO */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
              className="w-20 h-20 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20"
            >
              <CheckCircle className="w-10 h-10 text-primary" />
            </motion.div>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              Obrigado pela sua preferência.
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8 font-light leading-relaxed max-w-lg mx-auto">
              Seu pagamento foi processado com sucesso e os nossos mestres de torra já foram notificados. 
              Em breve, uma seleção de grãos excepcionais estará a caminho.
            </p>

            {paymentId && (
              <div className="mb-10 inline-block bg-muted/50 px-6 py-3 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Código da Transação
                </p>
                <p className="font-mono text-foreground tracking-wider">
                  #{paymentId}
                </p>
              </div>
            )}

            {/* AÇÕES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px] gap-2">
                <Link to="/orders">
                  <Package className="w-4 h-4" />
                  Acompanhar Pedido
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-w-[200px] gap-2 border-border/60 hover:bg-muted/50">
                <Link to="/products">
                  <Coffee className="w-4 h-4" />
                  Continuar Comprando
                </Link>
              </Button>
            </motion.div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}