"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileSpreadsheet, Landmark, Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { useGastosBancarios } from "@/lib/hooks/use-conciliacion";
import { conciliacionApi } from "@/lib/api/conciliacion";
import { formatDate, formatMoney, toNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { EstadoGastosMes, GastosMes } from "@/types/conciliacion";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const nombreMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`;

const ESTADO: Record<EstadoGastosMes, { icono: typeof Clock; clase: string; ayuda: string }> = {
  "Esperando asiento": {
    icono: Clock,
    clase: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    ayuda: "Registre en BC un asiento por el total, con fecha entre el día 25 y el fin de mes, y vuelva a conciliar.",
  },
  Conciliado: {
    icono: CheckCircle2,
    clase: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300",
    ayuda: "Los gastos del mes cruzaron con el asiento de BC.",
  },
  Revisar: {
    icono: AlertTriangle,
    clase: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
    ayuda: "Llegaron gastos nuevos después de conciliar el mes: el asiento ya no cubre el total.",
  },
};

interface Props {
  idCuenta?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  size?: ButtonProps["size"];
}

/**
 * Gastos bancarios (comisiones, tarifas e IVA del banco) agrupados por mes, con el total a
 * registrar en BC y el estado del cruce con el asiento mensual.
 */
export function GastosBancariosButton({ idCuenta, fechaInicio, fechaFin, size = "sm" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const listo = !!idCuenta && !!fechaInicio && !!fechaFin;
  return (
    <>
      <Button variant="outline" size={size} className="gap-2" disabled={!listo} onClick={() => setAbierto(true)}
              title="Comisiones, tarifas e IVA del banco agrupados por mes para el asiento mensual">
        <Landmark className="h-4 w-4 text-primary" />
        Gastos bancarios
      </Button>
      {listo && (
        <GastosBancariosDrawer idCuenta={idCuenta!} fechaInicio={fechaInicio!} fechaFin={fechaFin!}
                               open={abierto} onOpenChange={setAbierto} />
      )}
    </>
  );
}

function GastosBancariosDrawer({ idCuenta, fechaInicio, fechaFin, open, onOpenChange }: {
  idCuenta: string; fechaInicio: string; fechaFin: string; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const { data, isLoading, isError } = useGastosBancarios(idCuenta, fechaInicio, fechaFin, open);
  const [descargando, setDescargando] = useState(false);

  const descargar = async () => {
    setDescargando(true);
    try {
      await conciliacionApi.descargarGastosBancarios(idCuenta, fechaInicio, fechaFin);
    } catch {
      toast({ title: "No se pudo generar el Excel", description: "Intente de nuevo en unos segundos.", variant: "destructive" });
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent size="2xl">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle>Gastos bancarios</DrawerTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {data ? `${data.banco} · ${data.numero_cuenta}` : "Comisiones, tarifas e IVA del banco"}
                {data && <>{" · "}{formatDate(data.fecha_inicio)} al {formatDate(data.fecha_fin)} (meses completos)</>}
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={descargar}
                    disabled={descargando || !data?.meses.length}>
              {descargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-primary" />}
              Excel
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
          )}
          {isError && <p className="text-sm text-destructive">No se pudieron cargar los gastos bancarios.</p>}
          {data && !data.tiene_patrones && (
            <p className="text-sm text-muted-foreground">
              Este banco no tiene patrones de gastos configurados. Por ahora solo están Banco Guayaquil y Banco Pichincha.
            </p>
          )}
          {data && data.tiene_patrones && data.meses.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay gastos bancarios en el periodo.</p>
          )}
          {data?.meses.map((m) => <TarjetaMes key={m.mes} mes={m} />)}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TarjetaMes({ mes }: { mes: GastosMes }) {
  const [verDetalle, setVerDetalle] = useState(false);
  const est = ESTADO[mes.estado];
  const Icono = est.icono;
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{nombreMes(mes.mes)}</h3>
            <p className="text-xs text-muted-foreground">{mes.cantidad} movimientos del extracto</p>
          </div>
          <Badge variant="outline" className={cn("gap-1 border", est.clase)}>
            <Icono className="h-3.5 w-3.5" /> {mes.estado}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total a registrar en BC</p>
            <p className="text-xl font-bold tabular-nums">{formatMoney(mes.total)}</p>
            <p className="text-xs text-muted-foreground">
              Asiento entre el {formatDate(mes.fecha_asiento_desde)} y el {formatDate(mes.fecha_fin_mes)}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-3 space-y-1">
            {mes.categorias.map((c) => (
              <div key={c.categoria} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{c.categoria}</span>
                <span className="tabular-nums">{formatMoney(c.monto)}</span>
              </div>
            ))}
          </div>
        </div>

        {mes.asiento ? (
          <p className="text-xs">
            <span className="font-medium">Asiento de BC:</span> {mes.asiento.document_no} del {formatDate(mes.asiento.fecha)}
            {" · "}{mes.asiento.descripcion} · {formatMoney(mes.asiento.monto)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{est.ayuda}</p>
        )}
        {mes.estado === "Revisar" && (
          <p className="text-xs text-destructive">
            Sin asiento: {formatMoney(mes.total_pendiente)} de gastos nuevos. {est.ayuda}
          </p>
        )}

        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setVerDetalle((v) => !v)}>
          {verDetalle ? "Ocultar detalle" : "Ver detalle"}
        </Button>
      </div>

      {verDetalle && (
        <div className="border-t max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-1.5">Fecha</th>
                <th className="text-left font-medium px-3 py-1.5">Concepto</th>
                <th className="text-left font-medium px-3 py-1.5 hidden sm:table-cell">Tipo</th>
                <th className="text-right font-medium px-3 py-1.5">Monto</th>
              </tr>
            </thead>
            <tbody>
              {mes.movimientos.map((m) => (
                <tr key={m.id_movimiento} className={cn("border-t", !m.conciliado && mes.estado === "Revisar" && "bg-red-50 dark:bg-red-950/20")}>
                  <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(m.fecha)}</td>
                  <td className="px-3 py-1.5">
                    <span className="block truncate max-w-[16rem]" title={m.concepto}>{m.concepto}</span>
                    <span className="text-muted-foreground font-mono">{m.referencia}</span>
                  </td>
                  <td className="px-3 py-1.5 hidden sm:table-cell">{m.categoria}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-destructive">{formatMoney(toNumber(m.monto))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
