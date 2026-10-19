import axios, { AxiosError } from "axios";
import { leerSesion, limpiarSesion } from "@/lib/auth/session";

/** Error de la API con el código HTTP y el detalle que devolvió FastAPI. */
export class ApiError extends Error {
  status?: number;
  detail?: unknown;
  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** Convierte el `detail` de FastAPI (texto, objeto o lista de errores 422) en un mensaje legible. */
function mensajeDeError(error: AxiosError<any>): string {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        const campo = Array.isArray(d?.loc) ? d.loc.filter((p: any) => p !== "body").join(".") : "";
        return campo ? `${campo}: ${d?.msg}` : d?.msg;
      })
      .filter(Boolean)
      .join("; ");
  }
  if (detail && typeof detail === "object") {
    return (detail as any).error || (detail as any).detalle || JSON.stringify(detail);
  }
  if (error.code === "ECONNABORTED") return "El servidor tardó demasiado en responder.";
  if (!error.response) return "No se pudo conectar con el servidor.";
  return error.message || "Error inesperado";
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// El token se toma en cada petición (siempre el vigente, sin estado global duplicado)
apiClient.interceptors.request.use((config) => {
  const { token } = leerSesion();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const message = mensajeDeError(error);

    // Sesión vencida o usuario desactivado: limpiar todo y volver al login (una sola vez)
    if (status === 401 && typeof window !== "undefined") {
      limpiarSesion();
      if (!window.location.pathname.startsWith("/login")) {
        const volver = encodeURIComponent(window.location.pathname);
        window.location.replace(`/login?expired=1&redirect=${volver}`);
      }
    }

    return Promise.reject(new ApiError(message, status, error.response?.data?.detail));
  },
);
