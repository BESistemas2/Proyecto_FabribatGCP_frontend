import { apiClient } from "./client";

export interface GoogleLoginRequest {
  id_token: string;
}

export interface AuthUser {
  id_usuario: string; // 👈 Ajustado: en el backend se llama id_usuario
  email: string;
  name: string;
  picture?: string;
  domain: string;
  rol: "ADMIN" | "ANALISTA" | "TESORERO"; // 👈 Añadido: vital para control de acceso
}

export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const authApi = {
  loginWithGoogle: async (idToken: string): Promise<GoogleLoginResponse> => {
    const { data } = await apiClient.post<GoogleLoginResponse>(
      "identidad/auth/google",
      {
        id_token: idToken,
      } as GoogleLoginRequest,
    );

    return data;
  },

  // Manejo de Logout puramente local para no generar error 404
  logout: async (): Promise<void> => {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>("identidad/auth/me");
    return data;
  },
};

export const CORPORATE_DOMAIN = "bateriasecuador.com";

export function isCorporateEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${CORPORATE_DOMAIN}`);
}
