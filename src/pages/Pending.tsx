// src/pages/OrderPending.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Coffee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

export default function OrderPending() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <section className="pt-28 pb-12 bg-muted/30 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label mb-4 inline-block">Processamento</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
              Quase lá.
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-16 flex-grow flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 text-center border-amber-200/20"
          >
            <div className="w-20 h-20 mx-auto mb-8 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>

            <h2 className="font-serif text-2xl font-bold mb-4">Aguardando Confirmação</h2>
            <p className="text-muted-foreground text-lg mb-10 font-light leading-relaxed">
              Seu pedido foi registrado. Assim que o Mercado Pago confirmar a transação, 
              iniciaremos o preparo dos seus grãos. Isso geralmente leva apenas alguns instantes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px]">
                <Link to="/orders">Ver meus pedidos</Link>
              </Button>
              <Button asChild variant="ghost" className="gap-2">
                <Link to="/home"><Coffee className="w-4 h-4" /> Voltar ao Início</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}