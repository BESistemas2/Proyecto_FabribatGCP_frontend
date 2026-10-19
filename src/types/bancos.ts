export type EstadoCarga = "COMPLETADO" | "ERROR" | "PROCESANDO" | "PENDIENTE";
export type EstadoRPA = "ACTIVO" | "INACTIVO" | "ERROR" | "EJECUTANDO";
export type Moneda = "USD" | "EUR";

export interface CuentaBancaria {
  id_cuenta: string;
  banco_nombre: string;
  banco_codigo: string;
  alias: string;
  numero_cuenta: string;
  moneda: Moneda;
  cuenta_contable_bc: string;
  rpa_habilitado: boolean;
  auto_match_habilitado: boolean;
  rpa_frecuencia: "DIARIA" | "SEMANAL" | "MENSUAL";
  rpa_hora_ejecucion: string;
  rpa_intervalo_minutos: number;
  auto_match_frecuencia?: "DIARIA" | "SEMANAL" | "MENSUAL";
  auto_match_hora_ejecucion?: string;
  /** Nombre real del campo en el backend */
  auto_match_hora?: string | null;
  auto_match_intervalo_minutos?: number;
  activo?: boolean;
  grupo_registro_bc?: string | null;
  codigo_banco_bc?: string;
  estado_rpa: EstadoRPA;
  ultima_sincronizacion?: string;
  created_at: string;
  updated_at: string;
}

export interface CuentaBancariaCreate {
  banco_codigo: string;
  alias: string;
  numero_cuenta: string;
  moneda: Moneda;
  cuenta_contable_bc: string;
}

export interface CuentaBancariaUpdate {
  activo?: boolean;
  auto_match_hora?: string;
  rpa_habilitado?: boolean;
  auto_match_habilitado?: boolean;
  rpa_frecuencia?: "DIARIA" | "SEMANAL" | "MENSUAL";
  rpa_hora_ejecucion?: string;
  rpa_intervalo_minutos?: number;
  auto_match_frecuencia?: "DIARIA" | "SEMANAL" | "MENSUAL";
  auto_match_hora_ejecucion?: string;
  auto_match_intervalo_minutos?: number;
}

export interface SincronizarCatalogoResponse {
  status: string;
  cuentas_actualizadas: number;
  cuentas_nuevas: number;
  mensaje: string;
}

export interface CargaExtracto {
  id_carga: string;
  id_cuenta: string;
  /** Banco detectado por el ETL (PICHINCHA, GUAYAQUIL, PRODUBANCO, SOLIDARIO) */
  banco_nombre: string;
  banco_detectado?: string | null;
  alias_cuenta: string;
  nombre_archivo: string;
  fecha_carga: string;
  created_at?: string;
  total_registros_leidos?: number;
  registros_importados: number;
  registros_con_error: number;
  estado: EstadoCarga;
  /** Mensaje del ETL (resumen o motivo del error) */
  mensaje_log?: string | null;
  error_detalle?: string;
  creado_por: string;
  created_by?: string;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  saldo_inicial?: number | null;
  saldo_final?: number | null;
  url_archivo?: string | null;
}

/** Respuesta de POST /bancos/cargas/upload */
export interface CargaUploadResponse {
  status: string;
  id_carga: string;
  mensaje: string;
  banco?: string | null;
  registros_leidos: number;
  registros_importados: number;
  saldo_inicial?: number | null;
  saldo_final?: number | null;
  advertencias: string[];
}

export interface CargaExtractoUpload {
  id_cuenta: string;
  archivo?: File;
  /** @deprecated se usa archivo */
  file?: File;
  /** @deprecated el backend toma el usuario del token */
  created_by?: string;
  creado_por?: string;
  origen?: string;
}

export interface MovimientoBancoPendiente {
  id_movimiento: string;
  fecha_transaccion: string;
  numero_referencia: string;
  concepto: string;
  /** Con signo: positivo = crédito (ingreso), negativo = débito */
  monto: number;
  tipo_movimiento: "CREDITO" | "DEBITO";
  estado: string;
  regla_cruce?: string;
  info_adicional?: string | null;
}

export interface FiltrosCargas {
  id_cuenta?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoCarga;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
