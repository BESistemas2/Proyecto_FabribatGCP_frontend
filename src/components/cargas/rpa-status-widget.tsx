'use client';

import { Bot, Activity, Clock, AlertCircle, CheckCircle, Loader2, WifiOff, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';

export type RPAStatus = 'ACTIVO' | 'INACTIVO' | 'EJECUTANDO' | 'ERROR' | 'MODO_MANUAL';

export interface RPAStatusData {
  estado: RPAStatus;
  ultimaEjecucion?: string;
  proximaEjecucion?: string;
  frecuencia?: 'DIARIA' | 'SEMANAL' | 'MENSUAL';
  horaEjecucion?: string;
  intervaloMinutos?: number;
  cuentasMonitoreadas: number;
  ejecucionesExitosas: number;
  ejecucionesFallidas: number;
  mensaje?: string;
}

const STATUS_CONFIG: Record<RPAStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; pulse?: boolean }> = {
  ACTIVO: {
    label: 'RPA Activo',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    pulse: true,
  },
  INACTIVO: {
    label: 'RPA Inactivo',
    icon: WifiOff,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
  },
  EJECUTANDO: {
    label: 'Ejecutando...',
    icon: Loader2,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    pulse: true,
  },
  ERROR: {
    label: 'Error Crítico',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
  },
  MODO_MANUAL: {
    label: 'Modo Manual',
    icon: Bot,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
  },
};

interface RPAStatusWidgetProps {
  data: RPAStatusData;
  onConfigClick?: () => void;
  onToggleClick?: () => void;
  compact?: boolean;
  showStats?: boolean;
}

export function RPAStatusWidget({
  data,
  onConfigClick,
  onToggleClick,
  compact = false,
  showStats = true,
}: RPAStatusWidgetProps) {
  const config = STATUS_CONFIG[data.estado];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color, config.pulse && 'animate-spin')} />
        <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
        {data.proximaEjecucion && (
          <span className="text-xs text-muted-foreground">
            Próxima: {formatRelativeTime(data.proximaEjecucion)}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: config.color.replace('text-', '').replace('dark:', '') }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color, config.pulse && 'animate-spin')} />
            </div>
            <div>
              <CardTitle className={cn('text-lg', config.color)}>{config.label}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.mensaje || getDefaultMessage(data.estado)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onConfigClick && (
              <Button variant="ghost" size="icon" onClick={onConfigClick} className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onToggleClick && data.estado !== 'EJECUTANDO' && (
              <Button variant="outline" size="sm" onClick={onToggleClick}>
                {data.estado === 'ACTIVO' ? 'Detener' : 'Activar'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Última ejecución</p>
            <p className="font-mono text-sm">
              {data.ultimaEjecucion ? formatRelativeTime(data.ultimaEjecucion) : 'Nunca'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Próxima ejecución</p>
            <p className="font-mono text-sm">
              {data.proximaEjecucion ? formatRelativeTime(data.proximaEjecucion) : 'No programada'}
            </p>
          </div>
        </div>

        {data.frecuencia && data.horaEjecucion && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Programación: </span>
              <span className="text-muted-foreground">
                {data.frecuencia} a las {data.horaEjecucion}
                {data.intervaloMinutos && ` (cada ${data.intervaloMinutos} min)`}
              </span>
            </div>
          </div>
        )}

        {showStats && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{data.cuentasMonitoreadas}</p>
                <p className="text-xs text-muted-foreground">Cuentas monitoreadas</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.ejecucionesExitosas}</p>
                <p className="text-xs text-muted-foreground">Éxitos (24h)</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.ejecucionesFallidas}</p>
                <p className="text-xs text-muted-foreground">Fallos (24h)</p>
              </div>
            </div>
          </>
        )}

        {data.estado === 'MODO_MANUAL' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">RPA en Modo Manual</p>
                <p className="mt-1">
                  El bot Playwright no tiene accesos a portales bancarios. Las cargas se realizan
                  manualmente vía esta interfaz. La arquitectura está preparada para activación automática
                  cuando se configuren las credenciales RPA.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getDefaultMessage(estado: RPAStatus): string {
  switch (estado) {
    case 'ACTIVO':
      return 'El bot está monitoreando y descargando extractos automáticamente';
    case 'INACTIVO':
      return 'El bot está detenido. No se realizarán descargas automáticas';
    case 'EJECUTANDO':
      return 'El bot está procesando una descarga en este momento';
    case 'ERROR':
      return 'Error crítico en el bot. Revisar logs y configuración';
    case 'MODO_MANUAL':
      return 'Operando en modo manual. Cargue extractos usando el formulario';
    default:
      return '';
  }
}

export function RPAStatusCard({ data }: { data: RPAStatusData }) {
  return <RPAStatusWidget data={data} />;
}