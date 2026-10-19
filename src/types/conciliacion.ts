export type ReglaCruce =
  | "REGLA_1_EXACTA_CONSOLIDADO"
  | "REGLA_1_EXACTA"
  | "REGLA_2_PARCIAL"
  | "REGLA_4_SUBCONJUNTO_COMBINATORIO";

export type EstadoActa = "BORRADOR" | "CERRADO" | "APROBADO";

export interface NovedadesSync {
  nuevos: number;
  modificados: number;
  total_sincronizados: number;
  requiere_rematch: boolean;
}

export interface MovimientoBanco {
  id_movimiento: string;
  fecha_transaccion: string;
  numero_referencia: string;
  concepto: string;
  monto: number;
  tipo_movimiento?: string;
  estado: string;
  regla_cruce?: ReglaCruce;
}

export interface MovimientoErp {
  id_movimiento_erp: number;
  entry_no_bc: number;
  posting_date: string;
  document_no: string;
  external_document_no: string;
  description: string;
  monto: number;
  estado: string;
  regla_cruce?: ReglaCruce;
}

export interface MayorEditadoResponse {
  status: string;
  total_registros: number;
  novedades_sync?: NovedadesSync;
  data: MovimientoErp[];
}

export interface EjecutarConciliacionPayload {
  id_cuenta: string;
  periodo: string;
  cuenta_contable: string;
  creado_por: string;
  fecha_inicio: string; // YYYY-MM-DD Obligatorio
  fecha_fin: string; // YYYY-MM-DD Obligatorio
}

export interface ResultadoConciliacionResponse {
  id_acta: string;
  periodo: string;
  cuenta_contable: string;
  saldo_banco: number;
  saldo_libros: number;
  total_conciliado: number;
  transitos_banco: number;
  transitos_erp: number;
  total_partidas_en_transito: number;
  estado: EstadoActa;
  creado_por?: string;
  created_at?: string;
  updated_at?: string;
}
