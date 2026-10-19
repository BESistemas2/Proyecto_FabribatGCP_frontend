"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthUser, authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { actualizarUsuario, guardarSesion, leerSesion, limpiarSesion } from "@/lib/auth/session";
import type { RolUsuario } from "@/types/identity";

/** Roles que pueden cargar extractos, conciliar, cerrar y enviar actas (igual que el backend). */
export const ROLES_OPERACION: RolUsuario[] = ["ADMIN", "CONTABILIDAD"];

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  esAdmin: boolean;
  puedeOperar: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cerrarSesionLocal = useCallback(() => {
    limpiarSesion();
    setToken(null);
    setUser(null);
    queryClient.clear(); // que otro usuario en la misma pestaña no vea datos en caché
  }, [queryClient]);

  // Al cargar: recuperar la sesión guardada y validarla contra la API (rol actualizado)
  useEffect(() => {
    const { token: guardado, user: usuarioGuardado } = leerSesion();
    if (!guardado) {
      setIsLoading(false);
      return;
    }
    setToken(guardado);
    setUser(usuarioGuardado);
    authApi
      .getMe()
      .then((fresco) => {
        setUser(fresco);
        actualizarUsuario(fresco);
      })
      // Solo se cierra la sesión si la API la rechaza; un error de red o 500 no expulsa al usuario
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) cerrarSesionLocal();
      })
      .finally(() => setIsLoading(false));
  }, [cerrarSesionLocal]);

  const login = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const { access_token, user: datos } = await authApi.loginWithGoogle(idToken);
      guardarSesion(access_token, datos);
      setToken(access_token);
      setUser(datos);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    cerrarSesionLocal();
    window.google?.accounts?.id?.disableAutoSelect();
    window.location.replace("/login");
  }, [cerrarSesionLocal]);

  const refreshUser = useCallback(async () => {
    try {
      const fresco = await authApi.getMe();
      setUser(fresco);
      actualizarUsuario(fresco);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) cerrarSesionLocal();
    }
  }, [cerrarSesionLocal]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      esAdmin: user?.rol === "ADMIN",
      puedeOperar: !!user && ROLES_OPERACION.includes(user.rol),
      login,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
