'use client';

import { useState } from 'react';
import { Building2, CreditCard, Hash, Settings, ChevronRight, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';
import { CuentaBancaria } from '@/types/bancos';
import { getBancoConfig, getBancoLogo, ESTADO_RPA_CONFIG } from '@/lib/constants/bancos';

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
  const rpaStatusConfig = ESTADO_RPA_CONFIG[cuenta.estado_rpa as keyof typeof ESTADO_RPA_CONFIG] ?? {
    label: cuenta.estado_rpa || 'Desconocido',
    variant: 'secondary' as const,
    icon: 'help-circle',
    className: 'text-gray-500',
  };

  const handleRpaToggle = async (checked: boolean) => {
    setRpaLoading(true);
    try {
      await onRpaToggle(cuenta.id_cuenta, checked);
    } catch (error) {
      console.error('Error toggling RPA:', error);
    } finally {
      setRpaLoading(false);
    }
  };

  const handleAutoMatchToggle = async (checked: boolean) => {
    setAutoMatchLoading(true);
    try {
      await onAutoMatchToggle(cuenta.id_cuenta, checked);
    } catch (error) {
      console.error('Error toggling Auto-Match:', error);
    } finally {
      setAutoMatchLoading(false);
    }
  };

  return (
    <Card className="h-full transition-shadow hover:shadow-lg border-l-4" style={{ borderLeftColor: bancoConfig.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: bancoConfig.colorLight }}
            >
              <img
                src={logoUrl}
                alt={bancoConfig.nombre}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Building2 className="w-6 h-6 hidden" style={{ color: bancoConfig.color }} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold truncate max-w-[280px]">
                {cuenta.alias || cuenta.banco_nombre}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Badge variant="outline" className="gap-1 px-2 py-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cuenta.moneda === 'USD' ? '#22c55e' : '#3b82f6' }} />
                  {cuenta.moneda}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {cuenta.estado_rpa}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onConfigClick(cuenta)}
            disabled={isUpdating}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Número de Cuenta
            </p>
            <p className="font-mono font-medium text-lg tabular-nums truncate">{cuenta.numero_cuenta}</p>
          </div>
          <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Cuenta Contable BC
            </p>
            <p className="font-mono font-medium text-sm truncate">{cuenta.cuenta_contable_bc}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">RPA Habilitado</p>
                <p className="text-xs text-muted-foreground">
                  Descarga automática de extractos
                </p>
              </div>
            </div>
            <Switch
              checked={cuenta.rpa_habilitado}
              onCheckedChange={handleRpaToggle}
              disabled={rpaLoading || isUpdating}
              aria-label="Activar/Desactivar RPA"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Auto-Match Habilitado</p>
                <p className="text-xs text-muted-foreground">
                  Conciliación automática al cargar extractos
                </p>
              </div>
            </div>
            <Switch
              checked={cuenta.auto_match_habilitado}
              onCheckedChange={handleAutoMatchToggle}
              disabled={autoMatchLoading || isUpdating}
              aria-label="Activar/Desactivar Auto-Match"
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full', rpaStatusConfig.className)} />
            <span className="font-medium">{rpaStatusConfig.label}</span>
            {cuenta.ultima_sincronizacion && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Última sync: {new Date(cuenta.ultima_sincronizacion).toLocaleDateString('es-EC')}</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigClick(cuenta)}
            className="gap-1"
            disabled={isUpdating}
          >
            <Settings className="h-3.5 w-3.5" />
            Configuración Avanzada
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
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