"use client";

import { useState, useCallback, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActasGrid } from "@/components/actas/actas-grid";
import { PartidasTransitoDrawer } from "@/components/actas/partidas-transito-drawer";
import { useActas } from "@/lib/hooks/use-conciliacion";
import { formatDate } from "@/lib/utils/format";
import { useToast } from "@/lib/hooks/use-toast";
import { conciliacionApi } from "@/lib/api/conciliacion";
import { ResultadoConciliacionResponse } from "@/types/conciliacion";
import { cn } from "@/lib/utils/cn";

export default function ActasPage() {
  const { toast } = useToast();

  const { data: rawActas, isLoading, refetch } = useActas(100);
  const [selectedActa, setSelectedActa] =
    useState<ResultadoConciliacionResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Normalización resiliente del listado de actas
  const actas = useMemo<ResultadoConciliacionResponse[]>(() => {
    if (Array.isArray(rawActas)) return rawActas;
    if (Array.isArray((rawActas as any)?.data)) return (rawActas as any).data;
    if (Array.isArray((rawActas as any)?.actas)) return (rawActas as any).actas;
    return [];
  }, [rawActas]);

  // Contadores KPI normalizados
  const cerradasCount = useMemo(
    () =>
      actas.filter((a: ResultadoConciliacionResponse) =>
        ["CERRADO", "APROBADO", "COMPLETADO"].includes(a.estado?.toUpperCase()),
      ).length,
    [actas],
  );

  const borradorCount = useMemo(
    () =>
      actas.filter((a: ResultadoConciliacionResponse) =>
        ["BORRADOR", "PENDIENTE"].includes(a.estado?.toUpperCase()),
      ).length,
    [actas],
  );

  const handleViewTransito = useCallback(
    (acta: ResultadoConciliacionResponse) => {
      setSelectedActa(acta);
      setDrawerOpen(true);
    },
    [],
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedActa(null);
  }, []);

  // Descarga normalizada usando conciliacionApi (Genera el archivo .xlsx oficial)
  const handleDownload = useCallback(
    async (acta: ResultadoConciliacionResponse) => {
      try {
        const nombreArchivo = `Informe_Conciliacion_${acta.cuenta_contable || "acta"}_${acta.periodo || "periodo"}.xlsx`;
        await conciliacionApi.descargarExcelActa(acta.id_acta, nombreArchivo);

        toast({
          title: "Descarga iniciada",
          description: `Informe de Conciliación (${acta.periodo}) exportado a Excel`,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Error al exportar",
          description:
            error instanceof Error
              ? error.message
              : "Error al comunicarse con el servidor",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const handlePrint = useCallback((acta: ResultadoConciliacionResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formatUSD = (v: number) =>
      new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
      }).format(v || 0);
    const fechaGen = formatDate(acta.created_at);
    // Todo dato que viene de la API se escapa antes de insertarlo en el HTML (evita XSS)
    const esc = (v: unknown) =>
      String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Acta de Conciliación - ${esc(acta.periodo || "Detalle")}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; color: #1e293b; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
            .subtitle { font-size: 14px; color: #64748b; margin: 0 0 12px 0; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
            .metric { text-align: center; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
            .metric-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
            .metric-value { font-size: 20px; font-weight: 700; font-family: monospace; color: #0f172a; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .info-label { color: #64748b; }
            .info-value { font-weight: 600; color: #334155; }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = () => window.close();">
          <div class="header">
            <h1 class="title">Acta de Conciliación Bancaria</h1>
            <p class="subtitle">Cuenta: ${esc(acta.banco || acta.cuenta_contable || "S/N")} — Período: ${esc(acta.periodo || "—")}</p>
            <span class="badge" style="background: ${
              ["CERRADO", "APROBADO"].includes(acta.estado?.toUpperCase())
                ? "#22c55e"
                : "#f59e0b"
            }; color: white;">
              ${esc(acta.estado || "BORRADOR")}
            </span>
          </div>
          <div class="metrics">
            <div class="metric"><div class="metric-label">Movimiento neto banco</div><div class="metric-value">${formatUSD(acta.saldo_banco)}</div></div>
            <div class="metric"><div class="metric-label">Movimiento neto libros</div><div class="metric-value">${formatUSD(acta.saldo_libros)}</div></div>
            <div class="metric"><div class="metric-label">Total Conciliado</div><div class="metric-value">${formatUSD(acta.total_conciliado)}</div></div>
          </div>
          <div class="info">
            <div class="info-row"><span class="info-label">Creador:</span><span class="info-value">${esc(acta.creado_por || "Sistema")}</span></div>
            <div class="info-row"><span class="info-label">Fecha Generación:</span><span class="info-value">${fechaGen}</span></div>
            <div class="info-row"><span class="info-label">Partidas en Tránsito:</span><span class="info-value">${acta.total_partidas_en_transito || 0}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Actas de Conciliación
          </h1>
          <p className="text-muted-foreground text-sm">
            Historial de actas generadas y detalle de partidas en tránsito
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RotateCcw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Estado */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium md:text-base">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Total Actas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">{actas.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium md:text-base">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Cerradas / Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
              {cerradasCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium md:text-base">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              En Borrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {borradorCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grilla principal de Actas */}
      <ActasGrid
        actas={actas}
        isLoading={isLoading}
        onViewTransito={handleViewTransito}
        onDownload={handleDownload}
        onRefresh={refetch}
      />

      {/* Drawer lateral de Partidas en Tránsito */}
      <PartidasTransitoDrawer
        acta={selectedActa}
        open={drawerOpen}
        onOpenChange={handleCloseDrawer}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />
    </div>
  );
}
