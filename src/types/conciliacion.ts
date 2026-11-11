export type ReglaCruce =
  | "REGLA_1_EXACTA"
  | "REGLA_1_EXACTA_REF2_GYE"
  | "REGLA_2_1_A_N_REF"
  | "REGLA_2_PARCIAL"
  | "REGLA_4_SUBCONJUNTO_COMBINATORIO"
  | "REGLA_5_REF_ADICIONAL"
  | "REGLA_REVERSO_BC"
  | "REGLA_REVERSO_BANCO"
  | "REGLA_GASTOS_BANCARIOS";

/** BORRADOR: se puede volver a conciliar. CERRADO: partidas congeladas (APROBADO: actas antiguas). */
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
  id_movimiento_erp: string;
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
  status: "success" | "warning";
  /** false si Business Central no respondió y se muestran los datos guardados */
  sincronizado?: boolean;
  advertencia?: string | null;
  total_registros: number;
  novedades_sync?: NovedadesSync;
  data: MovimientoErp[];
}

export interface EjecutarConciliacionPayload {
  id_cuenta: string;
  periodo: string; // AAAA-MM
  fecha_inicio: string; // AAAA-MM-DD
  fecha_fin: string; // AAAA-MM-DD
}

export interface ResultadoConciliacionResponse {
  id_acta: string;
  id_cuenta?: string | null;
  periodo: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  banco?: string | null;
  /** Cruces nuevos de esta ejecución (solo en la respuesta de /ejecutar) */
  movimientos_conciliados?: number;
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

/** Partida pendiente de un acta (montos con signo: positivo = ingreso). */
export interface PartidaTransito {
  id: string;
  fecha: string;
  referencia: string;
  concepto: string;
  monto: number;
  tipo: "CREDITO" | "DEBITO";
  regla_cruce?: string | null;
  estado?: string | null;
  /** Solo partidas de BC */
  entry_no?: number | null;
  documento?: string | null;
}

export interface ActaDetalleResponse {
  acta: ResultadoConciliacionResponse;
  partidas_transito_banco: PartidaTransito[];
  partidas_transito_erp: PartidaTransito[];
}

export interface MovimientoBCVinculado {
  id_movimiento_bc: string;
  num_documento: string;
  external_document_no?: string;
  fecha: string;
  concepto: string;
  monto: number;
  cuenta_contable: string;
}

export interface GrupoConciliado {
  id_conciliacion: string;
  fecha_conciliacion: string;
  regla_aplicada: string;
  creado_por: string;
  /** null en los reversos de BC (asientos que se anulan entre sí, sin movimiento bancario) */
  banco: {
    id_movimiento_banco: string;
    fecha: string;
    concepto: string;
    referencia: string;
    monto: number;
    tipo: "CREDITO" | "DEBITO" | string;
  } | null;
  partidas_bc: MovimientoBCVinculado[];
  /** Reversos dentro del banco (Banco Guayaquil): los movimientos que se anulan entre sí */
  movimientos_banco?: {
    id_movimiento_banco: string;
    fecha: string;
    concepto: string;
    referencia: string;
    monto: number;
    tipo: "CREDITO" | "DEBITO" | string;
  }[];
  /** Número de REF/REF2 que une el pago con su reverso */
  referencia_reverso?: string;
  /** Gastos bancarios: mes del grupo (AAAA-MM) */
  mes?: string;
}

/** Gastos bancarios por mes (GET /conciliacion/gastos-bancarios) */
export type EstadoGastosMes = "Esperando asiento" | "Conciliado" | "Revisar";

export interface MovimientoGasto {
  id_movimiento: string;
  fecha: string;
  referencia: string;
  concepto: string;
  categoria: string;
  monto: number | string;
  conciliado: boolean;
}

export interface GastosMes {
  mes: string;
  fecha_fin_mes: string;
  fecha_asiento_desde: string;
  estado: EstadoGastosMes;
  total: number | string;
  total_pendiente: number | string;
  cantidad: number;
  categorias: { categoria: string; monto: number | string }[];
  movimientos: MovimientoGasto[];
  asiento: { document_no: string; fecha: string; descripcion: string; monto: number | string; entry_no_bc: number } | null;
}

export interface GastosBancariosResponse {
  id_cuenta: string;
  banco: string;
  numero_cuenta: string;
  codigo_bc: string;
  fecha_inicio: string;
  fecha_fin: string;
  tiene_patrones: boolean;
  meses: GastosMes[];
}

