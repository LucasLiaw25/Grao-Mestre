// FILE NAME: useauth.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import type { UserResponseDTO, AuthResponseDTO, UserLoginRequestDTO, UserRegisterRequestDTO } from "@/types";

const API_BASE_URL = 'graomestre-production.up.railway.app';

interface AuthContextType {
  user: UserResponseDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLoginRequestDTO) => Promise<void>;
  register: (data: UserRegisterRequestDTO) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("grao_user");
    const token = localStorage.getItem("grao_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);

    const handleAuthChanged = () => {
      const u = localStorage.getItem("grao_user");
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, []);

  const login = async (data: UserLoginRequestDTO) => {
    const res = await axios.post<AuthResponseDTO>(`${API_BASE_URL}/users/login`, data);
    localStorage.setItem("grao_token", res.data.token);
    localStorage.setItem("grao_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    window.dispatchEvent(new Event("auth-changed")); // Notifica outros componentes
  };

  const register = async (data: UserRegisterRequestDTO) => {
    await axios.post(`${API_BASE_URL}/users/register`, data);
    // Após o registro, o usuário precisará ativar a conta via e-mail,
    // então não fazemos login automático aqui.
  };

  const logout = () => {
    localStorage.removeItem("grao_token");
    localStorage.removeItem("grao_user");
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}