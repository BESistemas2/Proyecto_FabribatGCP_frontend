'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { ReglaCruce, REGLAS_CRUCE_CONFIG, getReglaConfig } from '@/lib/constants/bancos';

interface RuleBadgeProps {
  regla: ReglaCruce | string | null | undefined;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

export function RuleBadge({
  regla,
  variant = 'default',
  showIcon = false,
}: RuleBadgeProps) {
  if (!regla) return null;

  const config = getReglaConfig(regla);

  const baseClasses = 'font-medium';

  if (variant === 'compact') {
    return (
      <Badge variant="outline" title={config.descripcion || config.label} className={cn(config.className, baseClasses, 'px-2 py-0.5 text-xs')}>
        {config.shortLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(config.className, baseClasses, 'px-2.5 py-1 text-sm gap-1.5')}>
      {showIcon && (
        <span className="inline-flex items-center justify-center">
          {getRuleIcon(regla as ReglaCruce)}
        </span>
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

function getRuleIcon(regla: ReglaCruce) {
  switch (regla) {
    case 'REGLA_1_EXACTA':
    case 'REGLA_1_EXACTA_REF2_GYE':
    case 'REGLA_2_1_A_N_REF':
    case 'REGLA_5_REF_ADICIONAL':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case 'REGLA_2_PARCIAL':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l2 2 4-4" />
        </svg>
      );
    case 'REGLA_4_SUBCONJUNTO_COMBINATORIO':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    default:
      return null;
  }
}

interface RuleLegendProps {
  /** Si se indica, las reglas funcionan como filtro (clic para mostrar u ocultar sus cruces). */
  onToggle?: (regla: string) => void;
  /** Reglas desactivadas en el filtro. */
  ocultas?: ReadonlySet<string>;
  /** Cruces por regla en la vista actual. */
  conteos?: Record<string, number>;
  onMostrarTodas?: () => void;
}

export function RuleLegend({ onToggle, ocultas, conteos, onMostrarTodas }: RuleLegendProps = {}) {
  const filtrable = !!onToggle;
  const hayOcultas = !!ocultas && ocultas.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <span className="text-xs font-medium text-muted-foreground">
        {filtrable ? 'Filtrar por regla:' : 'Reglas:'}
      </span>
      <div className="flex flex-wrap gap-2">
        {Object.entries(REGLAS_CRUCE_CONFIG).map(([key, config]) => {
          const contenido = (
            <>
              {getRuleIcon(key as ReglaCruce)}
              {config.shortLabel}
              {conteos && (
                <span className="ml-0.5 rounded-full bg-background/70 px-1.5 text-[10px] font-semibold tabular-nums">
                  {conteos[key] ?? 0}
                </span>
              )}
            </>
          );
          if (!filtrable) {
            return (
              <Badge key={key} variant="outline" title={`${config.label}: ${config.descripcion}`}
                     className={cn(config.className, 'cursor-help text-xs gap-1 px-2 py-1')}>
                {contenido}
              </Badge>
            );
          }
          const activa = !ocultas?.has(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={activa}
              onClick={() => onToggle!(key)}
              title={`${config.label}: ${config.descripcion}\n${activa ? 'Clic para ocultar sus cruces' : 'Clic para mostrar sus cruces'}`}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <Badge
                variant="outline"
                className={cn(
                  'text-xs gap-1 px-2 py-1 cursor-pointer transition-all select-none',
                  activa
                    ? cn(config.className, 'hover:brightness-95')
                    : 'bg-background text-muted-foreground border-dashed opacity-60 line-through hover:opacity-90',
                )}
              >
                {contenido}
              </Badge>
            </button>
          );
        })}
      </div>
      {filtrable && hayOcultas && onMostrarTodas && (
        <button type="button" onClick={onMostrarTodas}
                className="text-xs font-medium text-primary underline-offset-2 hover:underline">
          Mostrar todas
        </button>
      )}
    </div>
  );
}
