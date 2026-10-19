export const API_ENDPOINTS = {
  BANCOS: {
    BASE: '/bancos',
    CUENTAS: '/bancos/cuentas',
    CUENTAS_SYNC: '/bancos/cuentas/sincronizar',
    CUENTA_BY_ID: (id: string) => `/bancos/cuentas/${id}`,
    CARGAS_UPLOAD: '/bancos/cargas/upload',
    CARGAS: '/bancos/cargas',
    MOVIMIENTOS_PENDIENTES: '/bancos/movimientos/pendientes',
  },
  CONCILIACION: {
    BASE: '/conciliacion',
    MAYOR_EDITADO: '/conciliacion/mayor-editado',
    EJECUTAR: '/conciliacion/ejecutar',
    ACTAS: '/conciliacion/actas',
    ACTA_BY_ID: (id: string) => `/conciliacion/actas/${id}`,
  },
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;