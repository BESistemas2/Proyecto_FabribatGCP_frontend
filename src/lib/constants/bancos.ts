export const BANCOS_ECUADOR = {
  PICHINCHA: {
    codigo: 'PICHINCHA',
    nombre: 'Banco Pichincha',
    shortName: 'Pichincha',
    color: '#0033A0',
    colorLight: '#E8EDF8',
    logo: '/logos/banco-pichincha.svg',
  },
  GUAYAQUIL: {
    codigo: 'GUAYAQUIL',
    nombre: 'Banco de Guayaquil',
    shortName: 'Guayaquil',
    color: '#0066CC',
    colorLight: '#E6F0FA',
    logo: '/logos/banco-guayaquil.svg',
  },
  PRODUBANCO: {
    codigo: 'PRODUBANCO',
    nombre: 'Produbanco',
    shortName: 'Produbanco',
    color: '#00A651',
    colorLight: '#E8F5ED',
    logo: '/logos/banco-produbanco.svg',
  },
  SOLIDARIO: {
    codigo: 'SOLIDARIO',
    nombre: 'Banco Solidario',
    shortName: 'Solidario',
    color: '#E60012',
    colorLight: '#FDEAEB',
    logo: '/logos/banco-solidario.svg',
  },
  BOLIVARIANO: {
    codigo: 'BOLIVARIANO',
    nombre: 'Banco Bolivariano',
    shortName: 'Bolivariano',
    color: '#FFB800',
    colorLight: '#FFF8E6',
    logo: '/logos/banco-bolivariano.svg',
  },
  INTERNACIONAL: {
    codigo: 'INTERNACIONAL',
    nombre: 'Banco Internacional',
    shortName: 'Internacional',
    color: '#005BAA',
    colorLight: '#E6F0F8',
    logo: '/logos/banco-internacional.svg',
  },
  AUSTRO: {
    codigo: 'AUSTRO',
    nombre: 'Banco del Austro',
    shortName: 'Austro',
    color: '#0096D6',
    colorLight: '#E6F4FC',
    logo: '/logos/banco-austro.svg',
  },
  MACHALA: {
    codigo: 'MACHALA',
    nombre: 'Banco de Machala',
    shortName: 'Machala',
    color: '#C41E3A',
    colorLight: '#FCEAEB',
    logo: '/logos/banco-machala.svg',
  },
} as const;

export type BancoCodigo = keyof typeof BANCOS_ECUADOR;

export function getBancoConfig(codigo: string) {
  return BANCOS_ECUADOR[codigo as BancoCodigo] || BANCOS_ECUADOR.PICHINCHA;
}

export function getBancoColor(codigo: string) {
  return getBancoConfig(codigo).color;
}

export function getBancoLogo(codigo: string) {
  return getBancoConfig(codigo).logo;
}

export function getBancoNombre(codigo: string) {
  return getBancoConfig(codigo).nombre;
}

export function getBancoShortName(codigo: string) {
  return getBancoConfig(codigo).shortName;
}

export const ESTADO_CARGA_CONFIG = {
  COMPLETADO: {
    label: 'Completado',
    variant: 'success' as const,
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300',
  },
  ERROR: {
    label: 'Error',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300',
  },
  PROCESANDO: {
    label: 'Procesando',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  },
  PENDIENTE: {
    label: 'Pendiente',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
  },
} as const;

export const ESTADO_RPA_CONFIG = {
  ACTIVO: {
    label: 'Activo',
    variant: 'success' as const,
    icon: 'circle',
    className: 'text-green-500',
  },
  INACTIVO: {
    label: 'Inactivo',
    variant: 'secondary' as const,
    icon: 'circle-off',
    className: 'text-gray-400',
  },
  ERROR: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: 'alert-circle',
    className: 'text-red-500',
  },
  EJECUTANDO: {
    label: 'Ejecutando',
    variant: 'default' as const,
    icon: 'loader',
    className: 'text-blue-500 animate-spin',
  },
} as const;

export const TIPO_MOVIMIENTO_CONFIG = {
  CREDITO: {
    label: 'Crédito',
    sign: '+',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  DEBITO: {
    label: 'Débito',
    sign: '-',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
} as const;

export type ReglaCruce =
  | 'REGLA_1_EXACTA_CONSOLIDADO'
  | 'REGLA_1_EXACTA'
  | 'REGLA_2_PARCIAL'
  | 'REGLA_4_SUBCONJUNTO_COMBINATORIO';

export interface RuleConfig {
  label: string;
  shortLabel: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  className: string;
}

export const REGLAS_CRUCE_CONFIG: Record<ReglaCruce, RuleConfig> = {
  REGLA_1_EXACTA_CONSOLIDADO: {
    label: 'Match Exacto Consolidado',
    shortLabel: 'Consolidado 1:N',
    variant: 'success',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  },
  REGLA_1_EXACTA: {
    label: 'Match Exacto 1:1',
    shortLabel: 'Exacto 1:1',
    variant: 'success',
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300',
  },
  REGLA_2_PARCIAL: {
    label: 'Match Parcial por Monto',
    shortLabel: 'Monto + Fecha',
    variant: 'warning',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  },
  REGLA_4_SUBCONJUNTO_COMBINATORIO: {
    label: 'Combinatorio Subconjunto N:1',
    shortLabel: 'Subset Sum',
    variant: 'info',
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  },
};