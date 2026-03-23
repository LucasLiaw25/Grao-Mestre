import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth"; 
import { Navbar } from "@/components/Navbar";

// Importação das suas páginas
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import ProductManagement from "./pages/ProductManagement";
import Account from "./pages/Account";
import UserManagement from "./pages/UserManagement";
import CategoryManagement from "./pages/CategoryManagement";
import OrderManagement from "./pages/OrderManagement";
import FinancialReport from "./pages/FinancialReport";
import ExpenseManagement from "./pages/ExpenseManagement";
import DailyOrderMonitor from "./pages/DailyOrderMonitor";
import AboutUs from "./pages/AboutUs";
import { DashboardLayout } from "./pages/DashboardLayout";
import OrderSuccess from "./pages/Sucess";
import OrderPending from "./pages/Pending";
import OrderFailure from "./pages/Failure";

const queryClient = new QueryClient();

// --- COMPONENTE DE PROTEÇÃO DE ROTA ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredScope?: string; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredScope }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (requiredScope) {
    // Verifica se o nome "ADMIN" está presente no array de objetos de scopes
    const hasRequiredScope = user?.scopes.some(s => s.name === requiredScope);
    
    if (!hasRequiredScope) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// --- GERENCIADOR DE ROTAS ---
const AppRoutes = () => {
  return (
    <>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Navbar />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/order/success" element={<OrderSuccess />} />
        <Route path="/order/pending" element={<OrderPending />} />
        <Route path="/order/failure" element={<OrderFailure />} />

        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment/pix/:id" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredScope="ADMIN">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="admin-dashboard" element={<DailyOrderMonitor />} />
          <Route path="category-management" element={<CategoryManagement />} />
          <Route path="product-management" element={<ProductManagement />} />
          <Route path="order-management" element={<OrderManagement />} />
          <Route path="expense-management" element={<ExpenseManagement />} />
          <Route path="financial-report" element={<FinancialReport />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function DashboardOverview() {
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-bold text-foreground mb-6">Painel de Controle</h1>
      <p className="text-muted-foreground">
        Bem-vindo! Utilize a barra lateral para gerenciar usuários, produtos e relatórios.
      </p>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider> 
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;