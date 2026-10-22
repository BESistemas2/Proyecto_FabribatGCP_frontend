"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { sumarMontos } from "@/lib/utils/format";
import { RefreshCw, Info, Layers, CheckCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useActas,
} from "@/lib/hooks/use-conciliacion";
import { useAuth } from "@/lib/hooks/use-auth";

export default function WorkbenchPage() {
  const { user, esAdmin, puedeOperar } = useAuth();
  const { toast } = useToast();
  const userEmail = user?.email || "";

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
  const periodo = fechaInicio.substring(0, 7); // AAAA-MM
  const filtrosListos = !!selectedCuentaId && !!fechaInicio && !!fechaFin;

  // 1. Movimientos bancarios pendientes DEL PERIODO
  const { data: movimientosBanco, isLoading: movimientosLoading } =
    useMovimientosPendientes(selectedCuentaId || "", fechaInicio, fechaFin, filtrosListos);

  // 2. Movimientos de BC (libro de bancos) pendientes del periodo
  const { data: mayorData, isLoading: mayorLoading } = useMayorEditado(
    selectedCuentaId || "",
    fechaInicio,
    fechaFin,
    filtrosListos,
  );

  // 3. Acta real de la cuenta y periodo (la crea el Auto-Match)
  const { data: actasCuenta } = useActas(24, selectedCuentaId || undefined, !!selectedCuentaId);
  const actaActual = useMemo(
    () => actasCuenta?.find((a) => a.periodo === periodo),
    [actasCuenta, periodo],
  );
  const actaCerrada = !!actaActual && actaActual.estado !== "BORRADOR";

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

  const movimientosErp = useMemo(() => mayorData?.data ?? [], [mayorData]);
  const novedadesSync = mayorData?.novedades_sync;
  const autoMatchMutation = useEjecutarAutoMatch();

  const isAnyLoading =
    cuentasLoading ||
    movimientosLoading ||
    mayorLoading ||
    autoMatchMutation.isPending;

  const tieneExtractoCargado = (movimientosBanco?.length ?? 0) > 0;

  // Montos con signo en ambos lados: la suma ya es el neto (en centavos, sin errores de redondeo)
  const saldoBanco = useMemo(() => sumarMontos(movimientosBanco ?? [], (m) => m.monto), [movimientosBanco]);
  const saldoLibros = useMemo(() => sumarMontos(movimientosErp, (m) => m.monto), [movimientosErp]);

  const handlePeriodoChange = useCallback((inicio: string, fin: string) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
  }, []);

  const handleCuentaChange = useCallback((id: string) => {
    setSelectedCuentaId(id);
  }, []);

  const handleSincronizar = async () => {
    try {
      const r = await sincronizarMutation.mutateAsync();
      toast({ title: "Catálogo sincronizado", description: `${(r as any).total_procesados ?? 0} cuentas actualizadas desde Business Central.`, variant: "success" });
    } catch (error) {
      toast({ title: "Error al sincronizar", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
    }
  };

  const handleEjecutarAutoMatch = () => {
    if (!selectedCuentaId || !fechaInicio || !fechaFin) return;
    autoMatchMutation.mutate(
      { id_cuenta: selectedCuentaId, periodo, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      {
        onSuccess: (data) =>
          toast({
            title: "Auto-Match completado",
            description: `${data.movimientos_conciliados ?? 0} movimiento(s) conciliado(s). Quedan ${data.transitos_banco} del banco y ${data.transitos_erp} de BC pendientes.`,
            variant: "success",
          }),
        onError: (error) =>
          toast({ title: "Error en Auto-Match", description: error.message, variant: "destructive" }),
      },
    );
  };

  const motivoSinAutoMatch = !puedeOperar
    ? "Su rol solo permite consultar"
    : actaCerrada
      ? "El acta de este periodo está cerrada"
      : !tieneExtractoCargado
        ? "No hay movimientos del banco pendientes en el periodo"
        : undefined;

  useEffect(() => {
    if (cuentas && cuentas.length > 0 && !selectedCuentaId) {
      setSelectedCuentaId(cuentas[0].id_cuenta);
    }
  }, [cuentas, selectedCuentaId]);


  return (
    <div className="flex min-w-0 flex-col gap-6">
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
          {actaActual && (
            <Badge variant={actaCerrada ? "secondary" : "outline"} className="text-xs">
              Acta {periodo}: {actaActual.estado}
            </Badge>
          )}
          {puedeOperar && actaActual && (
            <EnviarReporteModal idActa={actaActual.id_acta} defaultEmail={userEmail} />
          )}

          {esAdmin && (
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
          )}
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
      {mayorData?.advertencia && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{mayorData.advertencia}</span>
        </div>
      )}

      {novedadesSync?.requiere_rematch && vistaModo === "pendientes" && puedeOperar && !actaCerrada && (
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Cuenta Seleccionada</CardTitle>
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
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

      {/* KPIs (cada uno ya es una tarjeta) */}
      <div>
          {isAnyLoading ? (
            <KPICardsSkeleton />
          ) : (
            <KPICards
              saldoBanco={saldoBanco}
              saldoLibros={saldoLibros}
              tieneExtractoCargado={tieneExtractoCargado}
              pendientesBanco={movimientosBanco?.length ?? 0}
              pendientesErp={movimientosErp.length}
            />
          )}
      </div>

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
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Movimientos pendientes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Extracto del banco frente al Libro Mayor de Business Central
                </p>
              </div>
              <AutoMatchButton
                onClick={handleEjecutarAutoMatch}
                isPending={autoMatchMutation.isPending}
                disabled={!!motivoSinAutoMatch || movimientosLoading || mayorLoading}
                motivo={motivoSinAutoMatch}
              />
            </div>
          </CardHeader>
          <CardContent>
            <SplitView
              bankMovements={movimientosBanco || []}
              erpMovements={movimientosErp || []}
              isLoadingBank={movimientosLoading}
              isLoadingErp={mayorLoading}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="h-[min(70vh,680px)] min-h-[360px]">
              <ConciliadosView
                grupos={gruposConciliados || []}
                isLoading={conciliadosLoading}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}