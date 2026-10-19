import { apiClient } from "./client";
import { GrupoConciliado } from "@/components/workbench/conciliados-view";
import {
  EjecutarConciliacionPayload,
  ResultadoConciliacionResponse,
  MovimientoErp,
  MayorEditadoResponse,
} from "@/types";

export interface PartidaTransito {
  id: string;
  fecha: string;
  referencia: string;
  concepto: string;
  monto: number;
  tipo: "CREDITO" | "DEBITO";
  regla_cruce?: string;
  estado: string;
}

export interface ActaDetalleResponse {
  acta: ResultadoConciliacionResponse;
  partidas_transito_banco: PartidaTransito[];
  partidas_transito_erp: PartidaTransito[];
}

export const conciliacionApi = {
  // 1. Obtener Mayor Editado (ERP)
  getMayorEditado: async (
    fechaInicio: string,
    fechaFin: string,
    cuentaContable: string,
  ) => {
    const { data } = await apiClient.get<MayorEditadoResponse>(
      "/conciliacion/mayor-editado",
      {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          cuenta_contable: cuentaContable,
        },
        timeout: 120000,
      },
    );
    return data;
  },

  // 2. Ejecutar Motor Auto-Match
  ejecutarMatch: async (payload: EjecutarConciliacionPayload) => {
    const { data } = await apiClient.post<ResultadoConciliacionResponse>(
      "/conciliacion/ejecutar",
      payload,
      {
        timeout: 300000, // 5 minutos de timeout para algoritmos intensivos
      },
    );
    return data;
  },

  // 3. Historial de Actas
  getActas: async (limit = 50) => {
    const { data } = await apiClient.get<ResultadoConciliacionResponse[]>(
      "/conciliacion/actas",
      { params: { limit } },
    );
    return data;
  },

  // 4. Detalle de Acta
  getActaDetalle: async (idActa: string): Promise<ActaDetalleResponse> => {
    const { data } = await apiClient.get<ActaDetalleResponse>(
      `/conciliacion/actas/${idActa}`,
    );
    return data;
  },

  // 5. Grupos Conciliados (Tree/Acordeón)
  getConciliados: async (
    idCuenta: string,
    fechaInicio: string,
    fechaFin: string,
  ): Promise<GrupoConciliado[]> => {
    try {
      const response = await apiClient.get("/conciliacion/grupos", {
        params: {
          id_cuenta: idCuenta,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      });

      const body = response.data;

      // Unwrapping flexible de envolturas de FastAPI
      let rawList: any[] = [];
      if (Array.isArray(body)) {
        rawList = body;
      } else if (Array.isArray(body?.data)) {
        rawList = body.data;
      } else if (Array.isArray(body?.conciliaciones)) {
        rawList = body.conciliaciones;
      } else if (Array.isArray(body?.actas)) {
        rawList = body.actas;
      }

      // Normalización de DTOs preservando todos los fallbacks + Documento Externo BC
      return rawList.map((item: any, idx: number) => {
        const bancoRaw =
          item.banco || item.movimiento_banco || item.transaccion_banco || {};
        const partidasRaw =
          item.partidas_bc ||
          item.movimientos_erp ||
          item.asientos_bc ||
          item.partidas ||
          [];

        return {
          id_conciliacion:
            item.id_conciliacion || item.id_acta || item.id || `cruce-${idx}`,
          fecha_conciliacion:
            item.fecha_conciliacion ||
            item.fecha ||
            item.created_at ||
            new Date().toISOString(),
          regla_aplicada: item.regla_aplicada || item.regla || "EXACTO_1_1",
          creado_por: item.creado_por || item.created_by || "Sistema",
          banco: {
            id_movimiento_banco:
              bancoRaw.id_movimiento_banco || bancoRaw.id || `banco-${idx}`,
            fecha:
              bancoRaw.fecha ||
              bancoRaw.fecha_transaccion ||
              new Date().toISOString(),
            concepto:
              bancoRaw.concepto ||
              bancoRaw.descripcion ||
              "Movimiento Bancario",
            referencia: bancoRaw.referencia || bancoRaw.num_documento || "S/R",
            monto: Number(bancoRaw.monto || bancoRaw.importe || 0),
            tipo: (
              bancoRaw.tipo ||
              bancoRaw.tipo_movimiento ||
              "CREDITO"
            ).toUpperCase(),
          },
          partidas_bc: (Array.isArray(partidasRaw)
            ? partidasRaw
            : [partidasRaw]
          ).map((p: any, pIdx: number) => ({
            id_movimiento_bc: p.id_movimiento_bc || p.id || `bc-${idx}-${pIdx}`,
            num_documento:
              p.num_documento || p.documento || p.referencia || "DOC-BC",
            // ✅ AÑADIDO: Preserva el Documento Externo que envía el Backend
            external_document_no:
              p.external_document_no ||
              p.erp_ext_documento ||
              p.documento_externo ||
              p.external_document ||
              "",
            fecha: p.fecha || p.fecha_registro || new Date().toISOString(),
            concepto: p.concepto || p.descripcion || "Asiento Contable BC",
            monto: Number(p.monto || p.importe || 0),
            cuenta_contable: p.cuenta_contable || p.cuenta || "1.01.01",
          })),
        };
      });
    } catch (error) {
      console.warn(
        "Endpoint /conciliacion/grupos no disponible o retornó error:",
        error,
      );
      return [];
    }
  },

  // 6. Descarga Directa de Informe Excel
  descargarExcelActa: async (
    idActa: string,
    nombreArchivo?: string,
  ): Promise<void> => {
    const response = await apiClient.get(
      `/conciliacion/actas/${idActa}/exportar-excel`,
      {
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      nombreArchivo || `Informe_Conciliacion_${idActa}.xlsx`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 7. Enviar Reporte por Correo Electrónico
  enviarReporteEmail: async (
    idActa: string,
    payload: { destinatarios: string[]; comentario?: string },
  ) => {
    const { data } = await apiClient.post(
      `/conciliacion/actas/${idActa}/enviar-correo`,
      payload,
    );
    return data;
  },
};
