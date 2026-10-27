import { apiClient } from "./client";
import type {
  ActaDetalleResponse,
  EjecutarConciliacionPayload,
  GrupoConciliado,
  MayorEditadoResponse,
  ResultadoConciliacionResponse,
} from "@/types/conciliacion";
import type { CorteInicial, CorteInicialPayload, DashboardResponse } from "@/types/dashboard";

export type { ActaDetalleResponse, PartidaTransito } from "@/types/conciliacion";

/** Nombre de archivo del header Content-Disposition (si viene). */
function nombreDesdeHeader(header?: string): string | null {
  const m = header?.match(/filename="?([^";]+)"?/i);
  return m ? m[1] : null;
}

/** Descarga un .xlsx recibido como blob, con el nombre que envía el backend. */
function guardarExcel(
  response: { data: BlobPart; headers: Record<string, unknown> },
  porDefecto: string,
  forzado?: string,
) {
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    forzado || nombreDesdeHeader(response.headers["content-disposition"] as string | undefined) || porDefecto;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export const conciliacionApi = {
  // Libro de bancos de BC (pendientes del periodo) para una cuenta bancaria
  getMayorEditado: async (idCuenta: string, fechaInicio: string, fechaFin: string) => {
    const { data } = await apiClient.get<MayorEditadoResponse>("/conciliacion/mayor-editado", {
      params: { id_cuenta: idCuenta, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      timeout: 120000,
    });
    return data;
  },

  ejecutarMatch: async (payload: EjecutarConciliacionPayload) => {
    const { data } = await apiClient.post<ResultadoConciliacionResponse>("/conciliacion/ejecutar", payload, {
      timeout: 300000,
    });
    return data;
  },

  getActas: async (limit = 50, idCuenta?: string) => {
    const { data } = await apiClient.get<ResultadoConciliacionResponse[]>("/conciliacion/actas", {
      params: { limit, id_cuenta: idCuenta || undefined },
    });
    return data;
  },

  getActaDetalle: async (idActa: string): Promise<ActaDetalleResponse> => {
    const { data } = await apiClient.get<ActaDetalleResponse>(`/conciliacion/actas/${idActa}`);
    return data;
  },

  cerrarActa: async (idActa: string) => {
    const { data } = await apiClient.post<ResultadoConciliacionResponse>(`/conciliacion/actas/${idActa}/cerrar`);
    return data;
  },

  reabrirActa: async (idActa: string) => {
    const { data } = await apiClient.post<ResultadoConciliacionResponse>(`/conciliacion/actas/${idActa}/reabrir`);
    return data;
  },

  getConciliados: async (idCuenta: string, fechaInicio: string, fechaFin: string): Promise<GrupoConciliado[]> => {
    const { data } = await apiClient.get<GrupoConciliado[]>("/conciliacion/grupos", {
      params: { id_cuenta: idCuenta, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
    return data;
  },

  descargarExcelActa: async (idActa: string, nombreArchivo?: string): Promise<void> => {
    const response = await apiClient.get(`/conciliacion/actas/${idActa}/exportar-excel`, { responseType: "blob" });
    guardarExcel(response, `Informe_Conciliacion_${idActa}.xlsx`, nombreArchivo);
  },

  /** Excel "Detalle de cruces": qué cruzó con qué (y con qué regla), reversos y pendientes con observación. */
  descargarDetalleCruces: async (idCuenta: string, fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await apiClient.get("/conciliacion/reporte-cruces", {
      params: { id_cuenta: idCuenta, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      responseType: "blob",
      timeout: 120000,
    });
    guardarExcel(response, `Detalle_Cruces_${fechaInicio.substring(0, 7)}.xlsx`);
  },

  getDashboard: async (params: { desde: string; hasta: string; banco?: string | null; id_cuenta?: string | null }) => {
    const { data } = await apiClient.get<DashboardResponse>("/conciliacion/dashboard", {
      params: { desde: params.desde, hasta: params.hasta, banco: params.banco || undefined, id_cuenta: params.id_cuenta || undefined },
      timeout: 120000,
    });
    return data;
  },

  getCorteInicial: async (idCuenta: string): Promise<CorteInicial | null> => {
    const { data } = await apiClient.get<CorteInicial | null>(`/conciliacion/cortes/${idCuenta}`);
    return data;
  },

  guardarCorteInicial: async (idCuenta: string, payload: CorteInicialPayload): Promise<CorteInicial> => {
    const { data } = await apiClient.put<CorteInicial>(`/conciliacion/cortes/${idCuenta}`, payload);
    return data;
  },

  enviarReporteEmail: async (idActa: string, payload: { destinatarios: string[]; comentario?: string }) => {
    const { data } = await apiClient.post(`/conciliacion/actas/${idActa}/enviar-correo`, {
      destinatarios: payload.destinatarios,
      comentario: payload.comentario?.trim() || undefined,
    });
    return data as { status: string; message: string };
  },
};
