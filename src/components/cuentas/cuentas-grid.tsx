'use client';

import { useMemo, useState } from 'react';
import { Search, RotateCcw, Filter, Building2, CreditCard, Hash, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { CuentaBancaria } from '@/types/bancos';
import { CuentaCard, CuentaCardSkeleton } from './cuenta-card';

interface CuentasGridProps {
  cuentas: CuentaBancaria[];
  isLoading?: boolean;
  isSyncing?: boolean;
  onConfigClick: (cuenta: CuentaBancaria) => void;
  onCorteClick?: (cuenta: CuentaBancaria) => void;
  onRpaToggle: (idCuenta: string, enabled: boolean) => Promise<void>;
  onAutoMatchToggle: (idCuenta: string, enabled: boolean) => Promise<void>;
  onSyncClick: () => void;
  emptyMessage?: string;
}

export function CuentasGrid({
  cuentas,
  isLoading = false,
  isSyncing = false,
  onConfigClick,
  onCorteClick,
  onRpaToggle,
  onAutoMatchToggle,
  onSyncClick,
  emptyMessage = 'No se encontraron cuentas bancarias',
}: CuentasGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCuentas = useMemo(() => {
    if (!searchTerm) return cuentas;
    const term = searchTerm.toLowerCase();
    return cuentas.filter((cuenta) =>
      (cuenta.banco_nombre || '').toLowerCase().includes(term) ||
      (cuenta.alias || '').toLowerCase().includes(term) ||
      (cuenta.numero_cuenta || '').toLowerCase().includes(term) ||
      (cuenta.cuenta_contable_bc || '').toLowerCase().includes(term) ||
      (cuenta.banco_codigo || '').toLowerCase().includes(term)
    );
  }, [cuentas, searchTerm]);


  if (isLoading) {
    return (
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
        {[1, 2, 3, 4].map((i) => (
          <CuentaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredCuentas.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {searchTerm
              ? 'Intente ajustar los términos de búsqueda'
              : 'Sincronice el catálogo desde Dynamics 365 BC para cargar las cuentas'}
          </p>
          <Button onClick={onSyncClick} disabled={isSyncing} className="w-auto">
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sincronizando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Sincronizar con Business Central
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Cuentas
              <Badge variant="secondary" className="ml-2">
                {filteredCuentas.length} de {cuentas.length}
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar banco, cuenta, número, CC BC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>
              <Button
                onClick={onSyncClick}
                disabled={isSyncing}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Sincronizar con BC
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Los totales se muestran arriba, en las tarjetas KPI de la página */}

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {filteredCuentas.map((cuenta) => (
              <CuentaCard
                key={cuenta.id_cuenta}
                cuenta={cuenta}
                onConfigClick={onConfigClick}
                onCorteClick={onCorteClick}
                onRpaToggle={onRpaToggle}
                onAutoMatchToggle={onAutoMatchToggle}
                isUpdating={isSyncing}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}