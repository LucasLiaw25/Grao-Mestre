import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Novo campo
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordStrength = useMemo(() => {
  if (!password) {
    return { score: 0, label: "Vazio", color: "bg-border", width: "0%" };
  }
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 1, label: "Muito Fraca", color: "bg-red-500", width: "25%" },
    { score: 2, label: "Fraca", color: "bg-orange-500", width: "50%" },
    { score: 3, label: "Média", color: "bg-yellow-500", width: "75%" },
    { score: 4, label: "Forte", color: "bg-green-500", width: "100%" },
  ];
  
  return levels[score - 1] || levels[0];
}, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações Manuais antes do Submit
    if (password !== confirmPassword) {
      return toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
    }
    if (passwordStrength.score < 3) {
      return toast({ title: "Senha fraca", description: "A senha deve ter 8+ caracteres, uma letra maiúscula e um número.", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      await register({ name, email, phone, password });
      toast({ title: "Conta Criada!", description: "Por favor, cheque seu email para ativar sua conta." });
      navigate("/");
    } catch {
      toast({ title: "Error", description: "Registration failed. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-3xl font-bold text-foreground">Grão Mestre.</Link>
          <p className="text-muted-foreground mt-3">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Nome</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Seu nome completo"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Telefone</label>
              <input
                type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Senha</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="••••••••"
            />
            
            {/* Barra de Força da Senha */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                  <span className="text-muted-foreground">Strength</span>
                  <span style={{ color: passwordStrength.color.replace('bg-', 'text-') }}>{passwordStrength.label}</span>
                </div>
                <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: passwordStrength.width }}
                    className={`h-full ${passwordStrength.color} transition-all duration-500`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campo Repetir Senha */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Confirmar Senha</label>
            <input
              type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 bg-background border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                confirmPassword && password !== confirmPassword ? "border-red-500" : "border-border"
              }`}
              placeholder="••••••••"
            />
            {confirmPassword && password !== confirmPassword && (
              <span className="text-[11px] text-red-500 mt-1 block">As senhas não coincidem</span>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Criar Conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{" "}
          <Link to="/" className="text-primary font-medium hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}