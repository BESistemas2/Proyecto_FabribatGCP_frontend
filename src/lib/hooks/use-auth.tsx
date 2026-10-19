"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  AuthUser,
  authApi,
  GoogleLoginResponse,
  isCorporateEmail,
  CORPORATE_DOMAIN,
} from "@/lib/api/auth";
import { apiClient } from "@/lib/api/client";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "fabribat_auth_token";
const USER_KEY = "fabribat_auth_user";

const setAuthCookie = (token: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=28800; SameSite=Lax; Secure`;
  }
};

const removeAuthCookie = () => {
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; Secure`;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeAuth = useCallback(async () => {
    try {
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const storedUser =
        typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthCookie(storedToken);
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${storedToken}`;

        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        } catch {
          await logout();
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.loginWithGoogle(idToken);

      const { access_token, user: userData } = response;

      if (!isCorporateEmail(userData.email)) {
        throw new Error(
          `Acceso denegado. Solo se permiten correos del dominio @${CORPORATE_DOMAIN}`,
        );
      }

      setToken(access_token);
      setUser(userData);

      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setAuthCookie(access_token);

      apiClient.defaults.headers.common["Authorization"] =
        `Bearer ${access_token}`;
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      removeAuthCookie();
      delete apiClient.defaults.headers.common["Authorization"];
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    } catch (error) {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}