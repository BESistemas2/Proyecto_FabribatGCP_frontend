import { apiClient } from "./client";
import {
  CuentaBancaria,
  CuentaBancariaCreate,
  CuentaBancariaUpdate,
  SincronizarCatalogoResponse,
  CargaExtracto,
  CargaExtractoUpload,
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
  uploadExtracto: async (
    payload: CargaExtractoUpload,
  ): Promise<CargaExtracto> => {
    const formData = new FormData();

    const emailResponsable =
      payload.created_by || payload.creado_por || "operador@fabribat.com";

    // Requeridos por el schema de FastAPI
    formData.append("id_cuenta", payload.id_cuenta);
    formData.append("created_by", emailResponsable);
    formData.append("creado_por", emailResponsable);
    formData.append("origen", payload.origen || "MANUAL");

    // Adjunta el archivo bajo ambas claves ('file' y 'archivo')
    const fileToUpload = payload.archivo || payload.file;
    if (fileToUpload) {
      formData.append("file", fileToUpload);
      formData.append("archivo", fileToUpload);
    }

    const { data } = await apiClient.post<CargaExtracto>(
      "/bancos/cargas/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      },
    );
    return data;
  },

  getCargas: async (
    filtros: FiltrosCargas = {},
  ): Promise<PaginatedResponse<CargaExtracto>> => {
    const params = new URLSearchParams();
    if (filtros.id_cuenta) params.append("id_cuenta", filtros.id_cuenta);
    if (filtros.fecha_inicio)
      params.append("fecha_inicio", filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);
    if (filtros.estado) params.append("estado", filtros.estado);
    if (filtros.page) params.append("page", filtros.page.toString());
    if (filtros.limit) params.append("limit", filtros.limit.toString());

    const { data } = await apiClient.get<PaginatedResponse<CargaExtracto>>(
      `/bancos/cargas?${params.toString()}`,
    );
    return data;
  },

  // Movimientos Pendientes
  getMovimientosPendientes: async (
    idCuenta: string,
  ): Promise<MovimientoBancoPendiente[]> => {
    const { data } = await apiClient.get<MovimientoBancoPendiente[]>(
      `/bancos/movimientos/pendientes`,
      { params: { id_cuenta: idCuenta } },
    );
    return data;
  },
};
