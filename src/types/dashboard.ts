/** Respuesta de GET /conciliacion/dashboard (app/modulos/conciliacion/dashboard.py). */

export type CategoriaPartida =
  | "CHEQUE_NO_COBRADO"
  | "NOTA_DEBITO_NO_REGISTRADA"
  | "NOTA_CREDITO_NO_REGISTRADA"
  | "PENDIENTE_ACREDITAR"
  | "PENDIENTE_DEBITAR";

export interface LineaPuente {
  clave: CategoriaPartida;
  nombre: string;
  signo: 1 | -1;
  n: number;
  valor: number;
  ajuste: number;
}

export interface CuadreSaldos {
  fecha?: string;
  fecha_corte?: string;
  cuentas?: number;
  saldo_banco: number;
  saldo_libros: number;
  saldo_libros_calculado: number;
  diferencia: number;
  saldo_extracto?: number | null;
  diferencia_extracto?: number | null;
  lineas: LineaPuente[];
}

export interface DashboardCuenta {
  id_cuenta: string;
  banco: string;
  nombre: string;
  numero: string;
  codigo_bc: string;
  movimientos_banco: number;
  conciliados: number;
  parciales: number;
  monto_bruto: number;
  monto_conciliado: number;
  pct_conciliado_monto: number | null;
  pendientes_banco: number;
  pendiente_banco_monto: number;
  pendientes_bc: number;
  pendiente_bc_monto: number;
  diferencia_movimiento: number;
  diferencia: number;
  banco_ingresos: number;
  banco_egresos: number;
  banco_n_ingresos: number;
  banco_n_egresos: number;
  bc_ingresos: number;
  bc_egresos: number;
  bc_n_ingresos: number;
  bc_n_egresos: number;
  extracto_hasta: string | null;
  extracto_al_dia: boolean;
  auto_match: { fecha: string | null; error: boolean; resultado: string };
  acta_estado: string | null;
  actas_anteriores_abiertas: number;
  tiene_corte: boolean;
  fecha_corte: string | null;
  cuadre_saldos: CuadreSaldos | null;
  semaforo: "ok" | "warn" | "bad";
}

export interface DashboardConsolidado {
  cuentas: number;
  movimientos_banco: number;
  conciliados: number;
  parciales: number;
  pct_conciliado_monto: number | null;
  pct_parciales: number;
  transito_n: number;
  transito_monto: number;
  diferencia_sin_explicar: number;
  cuentas_con_diferencia: number;
  cuentas_sin_corte: number;
  extractos_atrasados: number;
  auto_match_con_error: number;
  banco_ingresos: number;
  banco_egresos: number;
  bc_ingresos: number;
  bc_egresos: number;
  cuadre_saldos: CuadreSaldos | null;
}

export interface DashboardResponse {
  filtros: { desde: string; hasta: string; banco: string | null; id_cuenta: string | null; fecha_inicio: string; fecha_fin: string };
  bancos: string[];
  consolidado: DashboardConsolidado;
  cuentas: DashboardCuenta[];
  reglas: { regla: string; n: number }[];
  antiguedad: { tramo: "0-30" | "31-60" | "61+"; n: number; monto: number }[];
  causas: { causa: string; n: number }[];
  tendencia: { periodo: string; etiqueta: string; pct: number | null }[];
  pendientes_antiguos: {
    cuenta: string;
    id_cuenta: string;
    origen: "Banco" | "BC" | "Corte inicial";
    fecha: string;
    referencia: string;
    detalle: string;
    monto: number;
    dias: number;
  }[];
  generado_el: string;
}

/** Corte inicial por cuenta (GET/PUT /conciliacion/cortes/{id_cuenta}). */
export interface PartidaInicial {
  id_partida?: number;
  categoria: CategoriaPartida;
  fecha: string;
  detalle: string;
  referencia?: string | null;
  valor: number | string;
  observacion?: string | null;
  estado?: string;
}

export interface CorteInicialPayload {
  fecha_corte: string;
  saldo_banco: number | string;
  saldo_libros: number | string;
  observacion?: string | null;
  partidas: PartidaInicial[];
}

export interface CorteInicial extends CorteInicialPayload {
  id_corte: string;
  id_cuenta: string;
  saldo_libros_calculado: number | string;
  diferencia: number | string;
  bloqueado: boolean;
  motivo_bloqueo: string | null;
  creado_por: string;
  actualizado_por: string | null;
  updated_at: string | null;
}

export const CATEGORIAS_PARTIDA: { value: CategoriaPartida; label: string; signo: 1 | -1; ayuda: string }[] = [
  { value: "CHEQUE_NO_COBRADO", label: "Cheques girados y no cobrados", signo: -1, ayuda: "BC lo registró; el banco aún no lo paga" },
  { value: "NOTA_DEBITO_NO_REGISTRADA", label: "Notas de débito no registradas", signo: 1, ayuda: "El banco debitó; falta registrarlo en BC" },
  { value: "NOTA_CREDITO_NO_REGISTRADA", label: "Notas de crédito no registradas", signo: -1, ayuda: "El banco acreditó; falta registrarlo en BC" },
  { value: "PENDIENTE_ACREDITAR", label: "Valores pendientes por acreditar", signo: 1, ayuda: "BC registró un ingreso que el banco aún no muestra" },
  { value: "PENDIENTE_DEBITAR", label: "Valores pendientes por debitar", signo: -1, ayuda: "BC registró un egreso que el banco aún no muestra" },
];
