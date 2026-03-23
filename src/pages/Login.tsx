import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      toast({ title: "Welcome back!", description: "Você logou com sucesso." });
      navigate("/home");
    } catch {
      toast({ title: "Error", description: "Email ou senha inválido.", variant: "destructive" });
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
          <p className="text-muted-foreground mt-3">Entre na sua conta</p>
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
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem uma conta?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Crie uma</Link>
        </p>
      </motion.div>
    </div>
  );
}
