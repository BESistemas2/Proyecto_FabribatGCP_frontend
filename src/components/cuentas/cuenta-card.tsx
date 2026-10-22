'use client';

import { useState } from 'react';
import { Building2, CreditCard, Hash, Settings, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';
import { CuentaBancaria } from '@/types/bancos';
import { getBancoConfig, getBancoLogo } from '@/lib/constants/bancos';
import { describirFrecuencia, resumenUltimaEjecucion } from '@/lib/utils/auto-match';

interface CuentaCardProps {
  cuenta: CuentaBancaria;
  onConfigClick: (cuenta: CuentaBancaria) => void;
  onRpaToggle: (idCuenta: string, enabled: boolean) => Promise<void>;
  onAutoMatchToggle: (idCuenta: string, enabled: boolean) => Promise<void>;
  isUpdating?: boolean;
}

export function CuentaCard({
  cuenta,
  onConfigClick,
  onRpaToggle,
  onAutoMatchToggle,
  isUpdating = false,
}: CuentaCardProps) {
  const [rpaLoading, setRpaLoading] = useState(false);
  const [autoMatchLoading, setAutoMatchLoading] = useState(false);

  const bancoConfig = getBancoConfig(cuenta.banco_codigo);
  const logoUrl = getBancoLogo(cuenta.banco_codigo);
  const titulo = cuenta.alias || cuenta.banco_nombre;
  const ultima = resumenUltimaEjecucion(cuenta);

  const toggle = async (fn: () => Promise<void>, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      await fn();
    } catch (error) {
      console.error('Error al actualizar la cuenta:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className="flex h-full min-w-0 flex-col overflow-hidden border-l-4 transition-shadow hover:shadow-lg"
      style={{ borderLeftColor: bancoConfig.color }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: bancoConfig.colorLight }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={bancoConfig.nombre}
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Building2 className={cn('h-6 w-6', logoUrl && 'hidden')} style={{ color: bancoConfig.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2 break-words text-base font-semibold leading-tight" title={titulo}>
              {titulo}
            </CardTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="gap-1 px-2 py-0 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cuenta.moneda === 'USD' ? '#22c55e' : '#3b82f6' }}
                />
                {cuenta.moneda}
              </Badge>
              {cuenta.banco_nombre && cuenta.banco_nombre !== titulo && (
                <span className="truncate text-xs text-muted-foreground">{cuenta.banco_nombre}</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onConfigClick(cuenta)}
            disabled={isUpdating}
            className="h-8 w-8 shrink-0"
            aria-label="Configurar cuenta"
            title="Configurar cuenta"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <dl className="grid gap-2 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
            <dt className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              N° de cuenta
            </dt>
            <dd className="ml-auto whitespace-nowrap font-mono font-medium tabular-nums">
              {cuenta.numero_cuenta || '—'}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
            <dt className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Cuenta contable BC
            </dt>
            <dd className="ml-auto whitespace-nowrap font-mono font-medium">
              {cuenta.cuenta_contable_bc || '—'}
            </dd>
          </div>
        </dl>

        <div className="space-y-3">
          <FilaInterruptor
            icono={<Settings className="h-4 w-4 text-amber-600" />}
            fondo="bg-amber-50"
            titulo="RPA"
            descripcion="Descarga automática de extractos"
            checked={cuenta.rpa_habilitado}
            disabled={rpaLoading || isUpdating}
            onChange={(v) => toggle(() => onRpaToggle(cuenta.id_cuenta, v), setRpaLoading)}
          />
          <FilaInterruptor
            icono={<CheckCircle className="h-4 w-4 text-primary" />}
            fondo="bg-primary/10"
            titulo="Auto-Match"
            descripcion={cuenta.auto_match_habilitado ? `${describirFrecuencia(cuenta)} y tras cada carga${cuenta.auto_match_enviar_correo === false ? '' : ' · envía correo'}` : 'Solo manual'}
            checked={cuenta.auto_match_habilitado}
            disabled={autoMatchLoading || isUpdating}
            onChange={(v) => toggle(() => onAutoMatchToggle(cuenta.id_cuenta, v), setAutoMatchLoading)}
          />
        </div>

        <div className="mt-auto space-y-2 border-t pt-3">
          <div className="flex min-w-0 items-start gap-2 text-xs" title={cuenta.auto_match_ultimo_resultado || undefined}>
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Última conciliación automática</p>
              <p className={cn('truncate font-medium', ultima.error && 'text-destructive')}>{ultima.texto}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigClick(cuenta)}
            className="h-8 w-full justify-between px-2"
            disabled={isUpdating}
          >
            <span className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Configuración
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilaInterruptor({
  icono,
  fondo,
  titulo,
  descripcion,
  checked,
  disabled,
  onChange,
}: {
  icono: React.ReactNode;
  fondo: string;
  titulo: string;
  descripcion: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', fondo)}>{icono}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{titulo}</p>
        <p className="truncate text-xs text-muted-foreground" title={descripcion}>
          {descripcion}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={`Activar/Desactivar ${titulo}`} className="shrink-0" />
    </div>
  );
}

export function CuentaCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg animate-pulse bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-48 animate-pulse bg-muted rounded" />
              <div className="h-4 w-32 animate-pulse bg-muted rounded" />
            </div>
          </div>
          <div className="w-8 h-8 animate-pulse bg-muted rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="h-3 w-24 animate-pulse bg-muted rounded" />
            <div className="h-6 w-20 animate-pulse bg-muted rounded" />
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="h-3 w-28 animate-pulse bg-muted rounded" />
            <div className="h-5 w-32 animate-pulse bg-muted rounded" />
          </div>
        </div>
        <div className="h-1 animate-pulse bg-muted" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg animate-pulse bg-muted" />
              <div className="space-y-1">
                <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                <div className="h-3 w-40 animate-pulse bg-muted rounded" />
              </div>
            </div>
            <div className="w-12 h-6 animate-pulse bg-muted rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg animate-pulse bg-muted" />
              <div className="space-y-1">
                <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                <div className="h-3 w-40 animate-pulse bg-muted rounded" />
              </div>
            </div>
            <div className="w-12 h-6 animate-pulse bg-muted rounded" />
          </div>
        </div>
        <div className="h-1 animate-pulse bg-muted" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse bg-muted" />
            <div className="h-4 w-24 animate-pulse bg-muted rounded" />
            <div className="h-4 w-40 animate-pulse bg-muted rounded" />
          </div>
          <div className="h-8 w-32 animate-pulse bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}