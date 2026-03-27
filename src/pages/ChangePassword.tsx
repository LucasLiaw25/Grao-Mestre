// FILE NAME: ResetPassword.tsx
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "@/lib/api"; 

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true); // Estado para verificar a validade inicial do token

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      toast({
        title: "Erro",
        description: "Token de redefinição de senha não encontrado.",
        variant: "destructive",
      });
    
    }
  }, [token, toast, navigate]);

  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return { score: 0, label: "Vazio", color: "bg-border", width: "0%" };
    }

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++; // Caractere especial

    const levels = [
      { score: 1, label: "Muito Fraca", color: "bg-red-500", width: "25%" },
      { score: 2, label: "Fraca", color: "bg-orange-500", width: "50%" },
      { score: 3, label: "Média", color: "bg-yellow-500", width: "75%" },
      { score: 4, label: "Forte", color: "bg-green-500", width: "100%" },
    ];

    return levels[score - 1] || levels[0];
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTokenValid || !token) {
      toast({ title: "Erro", description: "Token inválido ou ausente.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      return toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
    }
    if (passwordStrength.score < 3) { // Mantendo a mesma regra de força da senha do registro
      return toast({ title: "Senha fraca", description: "A senha deve ter 8+ caracteres, uma letra maiúscula, um número e um caractere especial.", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      await usersApi.updatePasswordWithToken(token, newPassword);
      toast({ title: "Sucesso!", description: "Sua senha foi redefinida com sucesso. Faça login com a nova senha." });
      navigate("/login"); 
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível redefinir sua senha. O link pode ter expirado ou ser inválido.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      // Se o token for inválido/expirado, pode ser útil redirecionar para a página de solicitação
      if (error.response?.status === 400 || error.response?.status === 409) { // BadCredentialsException ou ConflitException
        // navigate("/forgot-password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Link Inválido ou Expirado</h1>
          <p className="text-muted-foreground mb-6">Por favor, solicite um novo link de redefinição de senha.</p>
          <Link to="/change-password" className="text-primary font-medium hover:underline">
            Solicitar Nova Senha
          </Link>
        </div>
      </div>
    );
  }

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
          <p className="text-muted-foreground mt-3">Defina sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {/* Campo Nova Senha */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Nova Senha</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="••••••••"
              autoComplete="new-password" // Prática recomendada para navegadores <sources>[2]</sources>
              id="new-password" // Prática recomendada para navegadores <sources>[2]</sources>
            />

            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                  <span className="text-muted-foreground">Força</span>
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

          {/* Campo Confirmar Nova Senha */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={`w-full px-4 py-3 bg-background border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                confirmNewPassword && newPassword !== confirmNewPassword ? "border-red-500" : "border-border"
              }`}
              placeholder="••••••••"
              autoComplete="new-password" // Prática recomendada para navegadores <sources>[2]</sources>
              id="confirm-new-password" // Prática recomendada para navegadores
            />
            {confirmNewPassword && newPassword !== confirmNewPassword && (
              <span className="text-[11px] text-red-500 mt-1 block">As senhas precisam ser iguais</span>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
            {isLoading ? "Redefinindo senha..." : "Redefinir Senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}