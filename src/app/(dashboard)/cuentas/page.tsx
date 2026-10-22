"use client";

import { useState, useCallback } from "react";
import {
  Building2,
  RotateCcw,
  Zap,
  CheckCircle,
  Settings,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CuentasGrid } from "@/components/cuentas/cuentas-grid";
import { CuentaConfigDrawer } from "@/components/cuentas/cuenta-config-drawer";
import {
  useCuentasBancarias,
  useUpdateCuentaBancaria,
  useSincronizarCatalogo,
} from "@/lib/hooks/use-bancos";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToast } from "@/lib/hooks/use-toast";
import { CuentaBancaria } from "@/types/bancos";
import { cn } from "@/lib/utils/cn";

export default function CuentasPage() {
  const { toast } = useToast();
  const { esAdmin } = useAuth();

  // Configurar cuentas y sincronizar con BC es solo para ADMIN (el backend también lo exige)
  const soloAdmin = () => {
    toast({
      title: "Acción no permitida",
      description: "Solo el administrador puede configurar cuentas o sincronizar con Business Central.",
      variant: "destructive",
    });
  };

  const {
    data: cuentas,
    isLoading: cuentasLoading,
    refetch: refetchCuentas,
  } = useCuentasBancarias();
  const updateMutation = useUpdateCuentaBancaria();
  const sincronizarMutation = useSincronizarCatalogo();

  const [selectedCuenta, setSelectedCuenta] = useState<CuentaBancaria | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleConfigClick = useCallback((cuenta: CuentaBancaria) => {
    if (!esAdmin) return soloAdmin();
    setSelectedCuenta(cuenta);
    setDrawerOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedCuenta(null);
  }, []);

  const handleRpaToggle = async (idCuenta: string, enabled: boolean) => {
    if (!esAdmin) return soloAdmin();
    try {
      await updateMutation.mutateAsync({
        idCuenta,
        payload: { rpa_habilitado: enabled },
      });
      toast({
        title: enabled ? "RPA activado" : "RPA desactivado",
        description: `La descarga automática ha sido ${enabled ? "habilitada" : "deshabilitada"}`,
        variant: "success",
      });
      refetchCuentas();
    } catch (error) {
      toast({
        title: "Error al actualizar RPA",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      refetchCuentas(); // Revertir UI
    }
  };

  const handleAutoMatchToggle = async (idCuenta: string, enabled: boolean) => {
    if (!esAdmin) return soloAdmin();
    try {
      await updateMutation.mutateAsync({
        idCuenta,
        payload: { auto_match_habilitado: enabled },
      });
      toast({
        title: enabled ? "Auto-Match activado" : "Auto-Match desactivado",
        description: `La conciliación automática ha sido ${enabled ? "habilitada" : "deshabilitada"}`,
        variant: "success",
      });
      refetchCuentas();
    } catch (error) {
      toast({
        title: "Error al actualizar Auto-Match",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      refetchCuentas(); // Revertir UI
    }
  };

  const handleSyncClick = async () => {
    if (!esAdmin) return soloAdmin();
    try {
      const result = await sincronizarMutation.mutateAsync();
      toast({
        title: "Catálogo sincronizado",
        description: `${(result as any).total_procesados ?? 0} cuentas actualizadas desde Business Central.`,
        variant: "success",
      });
      refetchCuentas();
    } catch (error) {
      toast({
        title: "Error sincronizando",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const isAnyLoading =
    cuentasLoading || updateMutation.isPending || sincronizarMutation.isPending;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Catálogo de Cuentas Bancarias
          </h1>
          <p className="text-muted-foreground">
            Gestión de cuentas sincronizadas desde Dynamics 365 BC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetchCuentas()}
            disabled={cuentasLoading}
          >
            <RotateCcw
              className={cn("h-4 w-4 mr-2", cuentasLoading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium md:text-base">
              <Building2 className="h-5 w-5 text-primary" />
              Total Cuentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">
              {cuentas?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium md:text-base">
              <Zap className="h-5 w-5 text-amber-500" />
              RPA Habilitado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold tabular-nums text-amber-600">
              {cuentas?.filter((c) => c.rpa_habilitado).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium md:text-base">
              <CheckCircle className="h-5 w-5 text-primary" />
              Auto-Match Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold tabular-nums text-primary">
              {cuentas?.filter((c) => c.auto_match_habilitado).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {!cuentasLoading && cuentas && cuentas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No hay cuentas bancarias configuradas
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              El catálogo se obtiene sincronizando desde Dynamics 365 Business
              Central. Las cuentas no se crean manualmente en esta interfaz.
            </p>
            <Button
              onClick={handleSyncClick}
              disabled={sincronizarMutation.isPending}
              size="lg"
              className="gap-2"
            >
              {sincronizarMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Sincronizar Catálogo Ahora
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CuentasGrid
          cuentas={cuentas || []}
          isLoading={cuentasLoading}
          isSyncing={sincronizarMutation.isPending}
          onConfigClick={handleConfigClick}
          onRpaToggle={handleRpaToggle}
          onAutoMatchToggle={handleAutoMatchToggle}
          onSyncClick={handleSyncClick}
        />
      )}

      <CuentaConfigDrawer
        cuenta={selectedCuenta}
        open={drawerOpen}
        onOpenChange={handleCloseDrawer}
      />
    </div>
  );
}
