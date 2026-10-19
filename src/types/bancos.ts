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
  auto_match_intervalo_minutos?: number;
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
  banco_nombre: string;
  alias_cuenta: string;
  nombre_archivo: string;
  fecha_carga: string;
  registros_importados: number;
  registros_con_error: number;
  estado: EstadoCarga;
  error_detalle?: string;
  creado_por: string;
  created_by?: string;
}

export interface CargaExtractoUpload {
  id_cuenta: string;
  created_by?: string;
  creado_por?: string;
  origen?: string;
  archivo?: File;
  file?: File;
}

export interface MovimientoBancoPendiente {
  id_movimiento: string;
  fecha_transaccion: string;
  numero_referencia: string;
  concepto: string;
  monto: number;
  tipo_movimiento: "CREDITO" | "DEBITO";
  estado: "PENDIENTE" | "NO_CONCILIADO" | "CONCILIADO";
  regla_cruce?: string;
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
