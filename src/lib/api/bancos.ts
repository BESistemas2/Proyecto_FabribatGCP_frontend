import { apiClient } from "./client";
import {
  CuentaBancaria,
  CuentaBancariaCreate,
  CuentaBancariaUpdate,
  SincronizarCatalogoResponse,
  CargaExtracto,
  CargaExtractoUpload,
  CargaUploadResponse,
  MovimientoBancoPendiente,
  FiltrosCargas,
  PaginatedResponse,
} from "@/types/bancos";

export const bancosApi = {
  // Cuentas Bancarias
  getCuentas: async (): Promise<CuentaBancaria[]> => {
    const { data } = await apiClient.get<CuentaBancaria[]>("/bancos/cuentas");
    return data;
  },

  createCuenta: async (
    payload: CuentaBancariaCreate,
  ): Promise<CuentaBancaria> => {
    const { data } = await apiClient.post<CuentaBancaria>(
      "/bancos/cuentas",
      payload,
    );
    return data;
  },

  updateCuenta: async (
    idCuenta: string,
    payload: CuentaBancariaUpdate,
  ): Promise<CuentaBancaria> => {
    const { data } = await apiClient.put<CuentaBancaria>(
      `/bancos/cuentas/${idCuenta}`,
      payload,
    );
    return data;
  },

  sincronizarCatalogo: async (): Promise<SincronizarCatalogoResponse> => {
    const { data } = await apiClient.post<SincronizarCatalogoResponse>(
      "/bancos/cuentas/sincronizar",
    );
    return data;
  },

  // Cargas de Extractos
  uploadExtracto: async (payload: CargaExtractoUpload): Promise<CargaUploadResponse> => {
    const formData = new FormData();
    formData.append("id_cuenta", payload.id_cuenta);
    const archivo = payload.archivo || payload.file;
    if (archivo) formData.append("archivo", archivo); // un solo campo: el que espera FastAPI

    const { data } = await apiClient.post<CargaUploadResponse>("/bancos/cargas/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return data;
  },

  getCargas: async (filtros: FiltrosCargas = {}): Promise<PaginatedResponse<CargaExtracto>> => {
    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    const response = await apiClient.get<any[]>("/bancos/cargas", {
      params: {
        id_cuenta: filtros.id_cuenta || undefined,
        fecha_inicio: filtros.fecha_inicio || undefined,
        fecha_fin: filtros.fecha_fin || undefined,
        estado: filtros.estado || undefined,
        page,
        limit,
      },
    });
    const total = Number(response.headers["x-total-count"] ?? response.data.length);
    return {
      data: response.data.map(normalizarCarga),
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  getMovimientosPendientes: async (
    idCuenta: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<MovimientoBancoPendiente[]> => {
    const { data } = await apiClient.get<MovimientoBancoPendiente[]>("/bancos/movimientos/pendientes", {
      params: { id_cuenta: idCuenta, fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined },
    });
    return data.map((m) => ({ ...m, monto: Number(m.monto) }));
  },
};

/** Adapta la carga del backend al modelo de la pantalla (estado en mayúsculas, fechas, usuario). */
function normalizarCarga(c: any): CargaExtracto {
  const estado = String(c.estado || "").toUpperCase();
  return {
    ...c,
    estado: (["COMPLETADO", "ERROR", "PROCESANDO"].includes(estado)
      ? estado
      : estado === "INICIADO" ? "PROCESANDO" : "PENDIENTE") as CargaExtracto["estado"],
    banco_nombre: c.banco_detectado || "",
    alias_cuenta: c.alias_cuenta || "",
    fecha_carga: c.created_at,
    creado_por: c.created_by,
    registros_importados: c.registros_importados ?? 0,
    registros_con_error: 0,
    error_detalle: estado === "ERROR" ? c.mensaje_log : undefined,
    saldo_inicial: c.saldo_inicial != null ? Number(c.saldo_inicial) : null,
    saldo_final: c.saldo_final != null ? Number(c.saldo_final) : null,
  };
}
