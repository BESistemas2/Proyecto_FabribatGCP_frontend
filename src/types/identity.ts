export type RolUsuario = "ADMIN" | "BASICO" | "CONTABILIDAD" | "RECEPTOR_MAIL";

export interface Usuario {
  id_usuario: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UsuarioCreate {
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export interface UsuarioUpdateEstado {
  activo: boolean;
}

export interface UsuarioUpdateRol {
  rol: RolUsuario;
}

export interface UsuariosResponse {
  data: Usuario[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
