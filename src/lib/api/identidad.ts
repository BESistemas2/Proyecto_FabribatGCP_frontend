import { apiClient } from "./client";
import {
  Destinatario,
  Usuario,
  UsuarioCreate,
  UsuarioUpdateEstado,
  UsuarioUpdateRol,
  UsuariosResponse,
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