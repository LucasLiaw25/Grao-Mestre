// FILE NAME: ForgotPassword.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await usersApi.requestPasswordReset(email);
      toast({
        title: "Link enviado!",
        description: "Verifique seu e-mail para redefinir sua senha.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o link. Verifique o e-mail e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-3xl font-bold text-foreground">Grão Mestre.</Link>
          <p className="text-muted-foreground mt-3">Redefina sua senha</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Enviando link..." : "Enviar Link de Redefinição"}
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Lembrou da sua senha?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Faça login</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}