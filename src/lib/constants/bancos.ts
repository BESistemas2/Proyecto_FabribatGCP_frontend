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
  | 'REGLA_1_EXACTA'
  | 'REGLA_1_EXACTA_REF2_GYE'
  | 'REGLA_2_1_A_N_REF'
  | 'REGLA_2_PARCIAL'
  | 'REGLA_4_SUBCONJUNTO_COMBINATORIO'
  | 'REGLA_5_REF_ADICIONAL'
  | 'REGLA_REVERSO_BC';

export interface RuleConfig {
  label: string;
  shortLabel: string;
  /** Explicación para la leyenda (tooltip) */
  descripcion: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  className: string;
}

/** Reglas del motor de cruce (app/modulos/conciliacion/motor.py), en orden de aplicación. */
export const REGLAS_CRUCE_CONFIG: Record<ReglaCruce, RuleConfig> = {
  REGLA_REVERSO_BC: {
    label: 'Reverso en Business Central',
    shortLabel: 'Reverso BC',
    descripcion: 'Asientos con el mismo documento y fecha que se anulan entre sí (+X / -X). No cruzan con el banco.',
    variant: 'secondary',
    className: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-900 dark:text-stone-300',
  },
  REGLA_1_EXACTA: {
    label: 'Referencia + monto exacto',
    shortLabel: 'Exacto 1:1',
    descripcion: 'Misma referencia y monto, con hasta 3 días de diferencia.',
    variant: 'success',
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300',
  },
  REGLA_1_EXACTA_REF2_GYE: {
    label: 'Referencia REF2 + monto exacto',
    shortLabel: 'Exacto REF2',
    descripcion: 'Banco Guayaquil: cruce por la REF2 cuando no hay referencia principal.',
    variant: 'success',
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300',
  },
  REGLA_2_1_A_N_REF: {
    label: 'Consolidado 1:N por referencia',
    shortLabel: 'Consolidado 1:N',
    descripcion: 'Un movimiento del banco contra varios asientos de la misma referencia que suman su monto.',
    variant: 'success',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  },
  REGLA_2_PARCIAL: {
    label: 'Monto + fecha',
    shortLabel: 'Monto + Fecha',
    descripcion: 'Mismo monto en ±3 días y un único candidato posible.',
    variant: 'warning',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  },
  REGLA_4_SUBCONJUNTO_COMBINATORIO: {
    label: 'Suma de asientos',
    shortLabel: 'Suma 2-3',
    descripcion: 'La suma de 2 o 3 asientos de BC iguala el movimiento del banco (solución única).',
    variant: 'info',
    className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
  },
  REGLA_5_REF_ADICIONAL: {
    label: 'Referencia adicional del banco',
    shortLabel: 'Ref. adicional',
    descripcion: 'Pagos: la REF/REF2/REF3 del banco es el documento externo de BC, mismo monto, hasta 15 días.',
    variant: 'success',
    className: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300',
  },
};

export function getReglaConfig(regla: string | null | undefined): RuleConfig {
  return REGLAS_CRUCE_CONFIG[regla as ReglaCruce] ?? {
    label: regla || 'Manual',
    shortLabel: regla ? regla.replace(/^REGLA_/, '').replace(/_/g, ' ') : 'Manual',
    descripcion: '',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground border-border',
  };
}