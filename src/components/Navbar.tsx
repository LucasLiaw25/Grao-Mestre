// src/components/Navbar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query"; // Importar useQuery
import { ordersApi } from "@/lib/api"; // Importar ordersApi
import type { OrderResponseDTO, OrderStatus } from "@/types"; // Importar tipos
import { Home, Info, Menu, Package, ShoppingBag, User, X } from "lucide-react";


export function Navbar() {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth(); // Obter user do useAuth
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerBackground = useTransform(
    scrollY,
    [0, 50],
    ["hsla(30, 25%, 97%, 0)", "hsla(30, 25%, 97%, 0.95)"]
  );
  const headerShadow = useTransform(
    scrollY,
    [0, 50],
    ["none", "0 4px 20px -2px rgba(0,0,0,0.05)"]
  );
  const headerBorder = useTransform(
    scrollY,
    [0, 50],
    ["hsla(30, 15%, 88%, 0)", "hsla(30, 15%, 88%, 1)"]
  );

  const isHome = location.pathname === "/";

  const navStyle = isHome
    ? { backgroundColor: headerBackground, boxShadow: headerShadow, borderBottomColor: headerBorder }
    : {
        backgroundColor: "hsla(30, 25%, 97%, 0.95)",
        boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
        borderBottomColor: "hsla(30, 15%, 88%, 1)",
      };

  const navLinks = [
    { to: "/home", label: "Home" },
    { to: "/products", label: "Produtos" },
    { to: "/about", label: "Sobre Nós" }, 
  ];

  // NOVO: Query para buscar o pedido PENDING do usuário (carrinho)
  const { data: pendingOrder } = useQuery<OrderResponseDTO | undefined>({
    queryKey: ["pendingOrder", user?.id],
    queryFn: async () => {
      if (!user?.id) return undefined;
      const response = await ordersApi.filter({ userId: user.id, status: "PENDING" as OrderStatus });
      return response.data?.content?.[0] || undefined;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 0, // Queremos que o carrinho esteja sempre atualizado
    refetchInterval: 10 * 1000, // Refetch a cada 10 segundos para manter o contador atualizado
    refetchOnWindowFocus: true, // Refetch no foco da janela
  });

  // Calcula a quantidade total de itens no carrinho
  const cartItemCount = pendingOrder?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <motion.header
        style={navStyle}
        className="fixed top-0 left-0 right-0 z-50 border-b border-transparent supports-[backdrop-filter]:backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/home" className="flex-shrink-0 group">
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Grão Mestre.
              </span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary py-2 relative",
                    location.pathname === link.to ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                  {location.pathname === link.to && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <Link
                  to="/account"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  Minha Conta
                </Link>
              ) : (
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              )}
              <Link to="/orders" className="relative p-2 text-foreground hover:text-primary transition-colors hover:-translate-y-0.5 transform duration-200">
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount} // Key para animar a mudança do número
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-4">
              <Link to="/orders" className="relative p-2 text-foreground">
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-foreground">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

                <motion.div
        initial={false}
        animate={isMobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: "auto", display: "block" },
          closed: { opacity: 0, height: 0, transitionEnd: { display: "none" } },
        }}
        className="fixed top-20 left-0 right-0 z-40 bg-background border-b shadow-xl md:hidden overflow-hidden"
      >
        <div className="px-4 pt-2 pb-6 space-y-1">
          {/* Links de Navegação com Ícones */}
          <Link
            to="/home"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-4 text-base font-medium text-foreground hover:bg-muted rounded-xl"
          >
            <Home className="w-5 h-5 text-muted-foreground" />
            Home
          </Link>
          <Link
            to="/products"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-4 text-base font-medium text-foreground hover:bg-muted rounded-xl"
          >
            <Package className="w-5 h-5 text-muted-foreground" />
            Produtos
          </Link>
          <Link
            to="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-4 text-base font-medium text-foreground hover:bg-muted rounded-xl"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
            Sobre Nós
          </Link>

          {/* Seção de Conta/Autenticação */}
          {isAuthenticated ? (
            <Link
              to="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-4 text-base font-medium text-primary hover:bg-primary/10 rounded-xl"
            >
              <User className="w-5 h-5" />
              Minha Conta
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-4 text-base font-medium text-primary hover:bg-primary/10 rounded-xl"
            >
              <User className="w-5 h-5" />
              Sign In
            </Link>
          )}
        </div>
      </motion.div>
    </>
  );
}