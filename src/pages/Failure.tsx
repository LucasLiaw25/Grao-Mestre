// src/pages/OrderFailure.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

export default function OrderFailure() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <section className="pt-28 pb-12 bg-red-50/30 border-b border-red-100/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-red-600 text-xs uppercase tracking-[0.3em] font-bold mb-4 inline-block">
              Transação Interrompida
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
              Houve um contratempo.
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-16 flex-grow flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 text-center border-red-200/20"
          >
            <div className="w-20 h-20 mx-auto mb-8 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="font-serif text-2xl font-bold mb-4">O pagamento não foi aprovado</h2>
            <p className="text-muted-foreground text-lg mb-10 font-light leading-relaxed">
              Não se preocupe, seus itens ainda estão guardados no carrinho. 
              Você pode tentar novamente com outro método ou entrar em contato com seu banco.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="default" className="w-full sm:w-auto min-w-[200px] gap-2">
                <Link to="/orders">
                  <RefreshCw className="w-4 h-4" /> Tentar Novamente
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto min-w-[200px] gap-2">
                <a href="https://wa.me/seunumeroaqui" target="_blank" rel="noreferrer">
                  <MessageCircle className="w-4 h-4" /> Suporte via WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}