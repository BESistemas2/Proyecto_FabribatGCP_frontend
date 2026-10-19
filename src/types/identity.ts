// Única fuente de verdad de los roles en el frontend.
// Deben coincidir con RolUsuario en el backend (app/modulos/identidad/schemas.py).
export const ROLES = ["ADMIN", "CONTABILIDAD", "BASICO", "RECEPTOR_MAIL"] as const;

export type RolUsuario = (typeof ROLES)[number];

export const ROL_INFO: Record<
  RolUsuario,
  {
    label: string;
    descripcion: string;
    badge: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  ADMIN: {
    label: "Administrador",
    descripcion: "Acceso total: gestión de usuarios, cuentas y configuración.",
    badge: "destructive",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  CONTABILIDAD: {
    label: "Contabilidad",
    descripcion: "Carga de extractos, conciliaciones, actas y reportes.",
    badge: "outline",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  BASICO: {
    label: "Básico",
    descripcion: "Consulta de información y reportes.",
    badge: "secondary",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  RECEPTOR_MAIL: {
    label: "Receptor de correo",
    descripcion: "Recibe por correo los reportes de conciliación.",
    badge: "secondary",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
};

/** Información del rol con valor de respaldo si llega un rol desconocido. */
export function getRolInfo(rol: string | null | undefined) {
  return (
    ROL_INFO[rol as RolUsuario] ?? {
      label: rol || "Sin rol",
      descripcion: "",
      badge: "secondary" as const,
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    }
  );
}

export interface Usuario {
  id_usuario: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

/** Usuario activo que puede recibir reportes por correo (visible para cualquier rol). */
export interface Destinatario {
  id_usuario: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
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
