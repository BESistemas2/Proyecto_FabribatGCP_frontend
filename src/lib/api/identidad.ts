import { apiClient } from "./client";
import {
  Destinatario,
  Usuario,
  UsuarioCreate,
  UsuarioUpdateEstado,
  SugerenciaUsuario,
  UsuarioUpdate,
  UsuarioUpdateRol,
} from "@/types/identity";

export const identidadApi = {
  getUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await apiClient.get<Usuario[]>("/identidad/usuarios");
    return data;
  },

  // Lista de usuarios activos para elegir destinatarios de correo (cualquier rol)
  getDestinatarios: async (): Promise<Destinatario[]> => {
    const { data } = await apiClient.get<Destinatario[]>("/identidad/destinatarios");
    return data;
  },

  createUsuario: async (payload: UsuarioCreate): Promise<Usuario> => {
    const { data } = await apiClient.post<Usuario>("/identidad/usuarios", payload);
    return data;
  },

  updateEstado: async (
    idUsuario: string,
    payload: UsuarioUpdateEstado
  ): Promise<Usuario> => {
    const { data } = await apiClient.patch<Usuario>(
      `/identidad/usuarios/${idUsuario}/estado`,
      payload
    );
    return data;
  },

  updateUsuario: async (idUsuario: string, payload: UsuarioUpdate): Promise<Usuario> => {
    const { data } = await apiClient.put<Usuario>(`/identidad/usuarios/${idUsuario}`, payload);
    return data;
  },

  /** Nombre sugerido para un correo (registro existente, Google Workspace o deducido del correo) */
  getSugerencia: async (email: string): Promise<SugerenciaUsuario> => {
    const { data } = await apiClient.get<SugerenciaUsuario>("/identidad/usuarios/sugerencia", { params: { email } });
    return data;
  },

  updateRol: async (
    idUsuario: string,
    payload: UsuarioUpdateRol
  ): Promise<Usuario> => {
    const { data } = await apiClient.put<Usuario>(
      `/identidad/usuarios/${idUsuario}`,
      payload
    );
    return data;
  },
};