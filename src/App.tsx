import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
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
import ExpenseManagement from "./pages/ExpenseManagemente";
import OrderManagement from "./pages/OrderManagement";
import FinancialReport from "./pages/FinancialReport";
import { DashboardLayout } from "./pages/DashboardLayout";
import DailyOrderMonitor from "./pages/DailyOrderMonitor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/account" element={<Account />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="admin-dashboard" element={<DailyOrderMonitor />} />
              <Route path="admin-dashboard" element={<DailyOrderMonitor />} />
              <Route path="category-management" element={<CategoryManagement />} />
              <Route path="product-management" element={<ProductManagement />} />
              <Route path="expense-management" element={<ExpenseManagement />} />
              <Route path="order-management" element={<OrderManagement />} />
              <Route path="expense-management" element={<ExpenseManagement />} />
              <Route path="financial-report" element={<FinancialReport />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function DashboardOverview() {
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-bold text-foreground mb-6">Welcome to your Admin Dashboard!</h1>
      <p className="text-muted-foreground">Use the sidebar to navigate through management sections.</p>
    </div>
  );
}


export default App;
