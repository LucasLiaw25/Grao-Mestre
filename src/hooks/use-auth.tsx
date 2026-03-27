// FILE NAME: useauth.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"; // Adicionado useCallback
import axios from "axios";
import type { UserResponseDTO, AuthResponseDTO, UserLoginRequestDTO, UserRegisterRequestDTO } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AuthContextType {
  user: UserResponseDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLoginRequestDTO) => Promise<void>;
  register: (data: UserRegisterRequestDTO) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64)); 

    if (decodedPayload.exp) {
      const expirationTime = decodedPayload.exp * 1000; 
      return Date.now() >= expirationTime;
    }
    return true; 
  } catch (error) {
    console.error("Erro ao decodificar token JWT:", error);
    return true; 
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("grao_token");
    localStorage.removeItem("grao_user");
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
  }, []); 

  useEffect(() => {
    const storedUser = localStorage.getItem("grao_user");
    const token = localStorage.getItem("grao_token");

    if (token && isTokenExpired(token)) {
      console.log("Token expirado. Realizando logout automático.");
      logout(); 
      setIsLoading(false); 
      return; 
    }

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);

    const handleAuthChanged = () => {
      const u = localStorage.getItem("grao_user");
      const t = localStorage.getItem("grao_token");
      if (t && isTokenExpired(t)) {
        console.log("Token expirado detectado por auth-changed. Realizando logout automático.");
        logout();
      } else {
        setUser(u ? JSON.parse(u) : null);
      }
    };
    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, [logout]); 

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("grao_token");
      if (token && isTokenExpired(token)) {
        console.log("Verificação periódica: Token expirado. Realizando logout automático.");
        logout();
      }
    }, 60 * 1000); 

    return () => clearInterval(interval); 
  }, [logout]);

  const login = async (data: UserLoginRequestDTO) => {
    const res = await axios.post<AuthResponseDTO>(`${API_BASE_URL}/users/login`, data);
    localStorage.setItem("grao_token", res.data.token);
    localStorage.setItem("grao_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    window.dispatchEvent(new Event("auth-changed"));
  };

  const register = async (data: UserRegisterRequestDTO) => {
    await axios.post(`${API_BASE_URL}/users/register`, data);
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