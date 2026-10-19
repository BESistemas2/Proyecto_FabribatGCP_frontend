import { apiClient } from "./client";
import type { RolUsuario } from "@/types/identity";

export interface GoogleLoginRequest {
  id_token: string;
}

export interface AuthUser {
  id_usuario: string;
  email: string;
  name: string;
  picture?: string;
  domain: string;
  rol: RolUsuario;
}

export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
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

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>("identidad/auth/me");
    return data;
  },
};

export const CORPORATE_DOMAIN = "bateriasecuador.com";

export function isCorporateEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${CORPORATE_DOMAIN}`);
}
