"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Info, Layers, CheckCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KPICards, KPICardsSkeleton } from "@/components/workbench/kpi-cards";
import { AccountPeriodSelector } from "@/components/workbench/account-period-selector";
import { RuleLegend } from "@/components/workbench/rule-badge";
import { AutoMatchButton } from "@/components/workbench/auto-match-button";
import { SplitView } from "@/components/workbench/split-view";
import { ConciliadosView } from "@/components/workbench/conciliados-view";
import { EnviarReporteModal } from "@/components/workbench/enviar-reporte-modal";
import {
  useCuentasBancarias,
  useMovimientosPendientes,
  useSincronizarCatalogo,
} from "@/lib/hooks/use-bancos";
import {
  useMayorEditado,
  useEjecutarAutoMatch,
  useConciliados,
} from "@/lib/hooks/use-conciliacion";
import { useAuth } from "@/lib/hooks/use-auth";

export default function WorkbenchPage() {
  const { user } = useAuth();
  const userEmail = user?.email || "usuario@bateriasecuador.com";

  // Modo de vista: "pendientes" (SplitView Dual) vs "conciliados" (Árbol 1:N)
  const [vistaModo, setVistaModo] = useState<"pendientes" | "conciliados">(
    "pendientes",
  );

  const { data: cuentas, isLoading: cuentasLoading } = useCuentasBancarias();
  const sincronizarMutation = useSincronizarCatalogo();

  const [selectedCuentaId, setSelectedCuentaId] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const cuentaSeleccionada = cuentas?.find(
    (c) => c.id_cuenta === selectedCuentaId,
  );
  const cuentaContable = cuentaSeleccionada?.cuenta_contable_bc || "";

  // 1. Movimientos Bancarios Pendientes
  const { data: movimientosBanco, isLoading: movimientosLoading } =
    useMovimientosPendientes(
      selectedCuentaId || "",
      !!selectedCuentaId && !!fechaInicio && !!fechaFin,
    );

  // 2. Movimientos ERP (Mayor Editado + Novedades Sync)
  const { data: mayorData, isLoading: mayorLoading } = useMayorEditado(
    fechaInicio,
    fechaFin,
    cuentaContable,
    !!selectedCuentaId && !!fechaInicio && !!fechaFin && !!cuentaContable,
  );

  // 3. Movimientos Conciliados
  const { data: gruposConciliados, isLoading: conciliadosLoading } =
    useConciliados(
      selectedCuentaId || "",
      fechaInicio,
      fechaFin,
      vistaModo === "conciliados" &&
        !!selectedCuentaId &&
        !!fechaInicio &&
        !!fechaFin,
    );

  const movimientosErp = mayorData?.data || [];
  const novedadesSync = mayorData?.novedades_sync;
  const autoMatchMutation = useEjecutarAutoMatch();

  const isAnyLoading =
    cuentasLoading ||
    movimientosLoading ||
    mayorLoading ||
    autoMatchMutation.isPending;

  const tieneExtractoCargado = (movimientosBanco?.length ?? 0) > 0;

  const saldoBanco =
    movimientosBanco?.reduce(
      (sum, m) => sum + (m.tipo_movimiento === "CREDITO" ? m.monto : -m.monto),
      0,
    ) ?? 0;
  const saldoLibros = movimientosErp?.reduce((sum, m) => sum + m.monto, 0) ?? 0;

  const handlePeriodoChange = useCallback((inicio: string, fin: string) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
  }, []);

  const handleCuentaChange = useCallback((id: string) => {
    setSelectedCuentaId(id);
  }, []);

  const handleSincronizar = async () => {
    try {
      await sincronizarMutation.mutateAsync();
    } catch (error) {
      console.error("Error sincronizando catálogo:", error);
    }
  };

  const handleEjecutarAutoMatch = () => {
    if (!selectedCuentaId || !fechaInicio || !fechaFin) return;
    // La mutación se dispara desde el componente AutoMatchButton directamente
  };

  useEffect(() => {
    if (cuentas && cuentas.length > 0 && !selectedCuentaId) {
      setSelectedCuentaId(cuentas[0].id_cuenta);
    }
  }, [cuentas, selectedCuentaId]);

  // Identificador de acta dinámico según cuenta y período
  const idActaActual =
    selectedCuentaId && fechaInicio
      ? `acta-${selectedCuentaId}-${fechaInicio.substring(0, 7)}`
      : "";

  return (
    <div className="flex flex-col gap-6 h-full min-w-0">
      {/* Cabecera Principal + Tabs + Modal de Reporte */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Workbench de Conciliación
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestión de conciliaciones: Vista dual vs. Registros conciliados
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            value={vistaModo}
            onValueChange={(v) =>
              setVistaModo(v as "pendientes" | "conciliados")
            }
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 w-[280px]">
              <TabsTrigger value="pendientes" className="text-xs gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="conciliados" className="text-xs gap-1.5">
                <CheckCheck className="h-3.5 w-3.5 text-green-600" />
                Conciliados
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Modal de Exportación / Envío de Reporte por Correo */}
          {selectedCuentaId && fechaInicio && idActaActual && (
            <EnviarReporteModal
              idActa={idActaActual}
              defaultEmail={userEmail}
            />
          )}

          <button
            onClick={handleSincronizar}
            disabled={sincronizarMutation.isPending || cuentasLoading}
            className="border border-input bg-background hover:bg-accent px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2"
          >
            <RefreshCw
              className={
                sincronizarMutation.isPending
                  ? "animate-spin h-3.5 w-3.5"
                  : "h-3.5 w-3.5"
              }
            />
            Sincronizar Catálogo
          </button>
        </div>
      </div>

      {/* Filtros de Consulta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros de Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountPeriodSelector
            cuentas={cuentas || []}
            selectedCuentaId={selectedCuentaId}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onCuentaChange={handleCuentaChange}
            onPeriodoChange={handlePeriodoChange}
            disabled={cuentasLoading}
          />
        </CardContent>
      </Card>

      {/* Banner de Notificación de Novedades desde Business Central */}
      {novedadesSync?.requiere_rematch && vistaModo === "pendientes" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 animate-in fade-in-0">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Se detectaron novedades desde Business Central:{" "}
              <strong>{novedadesSync.nuevos} movimiento(s) nuevo(s)</strong> y{" "}
              <strong>{novedadesSync.modificados} modificado(s)</strong>. Le
              recomendamos volver a ejecutar el Auto-Match.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 hover:bg-amber-500/20 text-xs shrink-0"
            onClick={handleEjecutarAutoMatch}
            disabled={autoMatchMutation.isPending}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${
                autoMatchMutation.isPending ? "animate-spin" : ""
              }`}
            />
            Re-ejecutar Auto-Match
          </Button>
        </div>
      )}

      {/* Tarjeta de Reglas */}
      {cuentaSeleccionada && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cuenta Seleccionada</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">
                  {cuentaSeleccionada.banco_nombre}
                </span>
                <span className="font-mono">
                  {cuentaSeleccionada.numero_cuenta}
                </span>
                <span>• CC: {cuentaSeleccionada.cuenta_contable_bc}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RuleLegend />
          </CardContent>
        </Card>
      )}

      {/* Cards de KPIs */}
      <Card>
        <CardContent className="pt-0">
          {isAnyLoading ? (
            <KPICardsSkeleton />
          ) : (
            <KPICards
              saldoBanco={saldoBanco}
              saldoLibros={saldoLibros}
              tieneExtractoCargado={tieneExtractoCargado}
            />
          )}
        </CardContent>
      </Card>

      {/* Contenido Dinámico según la Vista Seleccionada */}
      {!fechaInicio || !fechaFin ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Seleccione un período</h3>
            <p className="text-muted-foreground text-sm">
              Elija un rango de fechas para consultar los movimientos bancarios
              y del Libro Mayor.
            </p>
          </CardContent>
        </Card>
      ) : vistaModo === "pendientes" ? (
        <Card className="flex-1 min-h-0">
          <CardContent className="pt-0 h-full">
            <AutoMatchButton
              idCuenta={selectedCuentaId!}
              periodo={fechaInicio.substring(0, 7)}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              cuentaContable={cuentaContable}
              creadoPor={userEmail}
              disabled={
                autoMatchMutation.isPending ||
                movimientosLoading ||
                mayorLoading ||
                !tieneExtractoCargado
              }
            />
            <Separator className="my-4" />
            <div className="h-[calc(100vh-420px)] min-h-[400px]">
              <SplitView
                bankMovements={movimientosBanco || []}
                erpMovements={movimientosErp || []}
                isLoadingBank={movimientosLoading}
                isLoadingErp={mayorLoading}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 min-h-0">
          <CardContent className="pt-4 h-full">
            <div className="h-[calc(100vh-380px)] min-h-[400px]">
              <ConciliadosView
                grupos={gruposConciliados || []}
                isLoading={conciliadosLoading}
                onDesconciliar={(id) => {
                  console.log("Desconciliar id:", id);
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}