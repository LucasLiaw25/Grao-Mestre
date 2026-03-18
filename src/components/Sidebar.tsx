// src/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  User,
  Tag,
  Coffee,
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Menu,
  X,
  Wallet,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Fecha o sidebar ao navegar em mobile
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Trava o scroll do body quando o sidebar estiver aberto em mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { to: "/dashboard/admin-dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    { to: "/dashboard/user-management", label: "Users", icon: User },
    { to: "/dashboard/category-management", label: "Categories", icon: Tag },
    { to: "/dashboard/product-management", label: "Products", icon: Coffee },
    { to: "/dashboard/order-management", label: "Orders", icon: ShoppingBag },
    { to: "/dashboard/financial-report", label: "Reports", icon: BarChart3 },
    { to: "/dashboard/expense-management", label: "Expense", icon: Wallet },
  ];

  // Componente interno com tipagem corrigida para aceitar className
  const SidebarContent = ({ innerClassName }: { innerClassName?: string }) => (
    <aside
      className={cn(
        "w-64 bg-card border-r border-border/40 p-6 flex flex-col h-full shadow-sm",
        innerClassName,
        className
      )}
    >
      <div className="mb-10 flex items-center justify-between flex-shrink-0">
        <Link to="/" className="flex-shrink-0 group">
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors italic">
            Grão Mestre.
          </span>
        </Link>

        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border/40"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar -mr-2 pr-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-sm transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-[inset_0_0_10px_rgba(var(--primary),0.02)]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border-l-2 border-transparent"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-60")} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border/40 text-[10px] text-muted-foreground/50 flex-shrink-0">
        <p className="uppercase tracking-[0.2em] font-bold mb-1.5 text-foreground/70">Admin System</p>
        <p className="font-serif italic font-medium">© {new Date().getFullYear()} Grão Mestre.</p>
        <p className="font-serif italic">Curated Excellence.</p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Botão Hambúrguer Mobile — Visível apenas quando o sidebar está fechado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-5 left-5 z-40 p-2.5 rounded-sm bg-card border border-border/60 text-foreground shadow-md hover:bg-muted transition-all active:scale-95"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar Desktop — Fixo (sticky) e não cresce com o scroll */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0 lg:z-30">
        <SidebarContent />
      </div>

      {/* Drawer Mobile — Overlay escuro */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] bg-background/60 backdrop-blur-md transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Mobile — Painel deslizante */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 z-[70] h-full w-72 transform transition-transform duration-500 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent innerClassName="w-full border-none" />
      </div>
    </>
  );
}