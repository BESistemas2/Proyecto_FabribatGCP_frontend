"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Flag, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetalleCrucesButton } from "@/components/workbench/detalle-cruces-button";
import { BarrasHorizontales, Puente, TablaPuente, Tendencia } from "@/components/dashboard/graficos";
import { useDashboard } from "@/lib/hooks/use-conciliacion";
import { getReglaConfig } from "@/lib/constants/bancos";
import { formatMoney, formatMoneyCompact } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { DashboardCuenta, DashboardResponse } from "@/types/dashboard";

const TODOS = "__todos__";
const mes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const fecha = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v.toLocaleString("es-EC", { maximumFractionDigits: 1 })}%`);

function presets() {
  const hoy = new Date();
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return [
    { id: "actual", label: "Mes actual", desde: mes(hoy), hasta: mes(hoy) },
    { id: "anterior", label: "Mes anterior", desde: mes(anterior), hasta: mes(anterior) },
    { id: "anio", label: "Año a la fecha", desde: `${hoy.getFullYear()}-01`, hasta: mes(hoy) },
  ];
}

function Kpi({ titulo, valor, detalle, estado, barra }: {
  titulo: string; valor: string; detalle?: React.ReactNode; estado?: "ok" | "warn" | "bad"; barra?: number | null;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-brand-yellow" />
      <CardContent className="space-y-1.5 p-4">
        <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
        <p className={cn("font-mono text-2xl font-bold tracking-tight",
          estado === "bad" && "text-destructive", estado === "ok" && "text-green-700 dark:text-green-400")}>{valor}</p>
        {detalle && <div className="text-xs text-muted-foreground">{detalle}</div>}
        {barra !== undefined && barra !== null && (
          <div className="h-1.5 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-green-600" style={{ width: `${Math.min(100, barra)}%` }} /></div>
        )}
      </CardContent>
    </Card>
  );
}

function Semaforo({ s }: { s: DashboardCuenta["semaforo"] }) {
  return <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full",
    s === "ok" ? "bg-green-600" : s === "warn" ? "bg-amber-500" : "bg-destructive")} />;
}

export default function DashboardPage() {
  const [p] = useState(presets);
  const [desde, setDesde] = useState(p[0].desde);
  const [hasta, setHasta] = useState(p[0].hasta);
  const [banco, setBanco] = useState<string | null>(null);
  const [idCuenta, setIdCuenta] = useState<string | null>(null);

  // Las cuentas del filtro salen de la consulta sin filtro de cuenta (todas las del banco elegido)
  const { data: base } = useDashboard(desde, hasta, banco, null);
  const { data, isFetching, error, refetch } = useDashboard(desde, hasta, banco, idCuenta);
  const cuentasFiltro = base?.cuentas ?? [];
  const cuenta = idCuenta ? data?.cuentas.find((c) => c.id_cuenta === idCuenta) ?? null : null;

  const setRango = (d: string, h: string) => { setDesde(d); setHasta(h); };
  const presetActivo = p.find((x) => x.desde === desde && x.hasta === hasta)?.id;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Conciliación</h1>
          <p className="text-sm text-muted-foreground">Estado de las cuentas, pendientes y calidad del cruce automático</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cuenta && data && (
            <DetalleCrucesButton idCuenta={cuenta.id_cuenta} fechaInicio={data.filtros.fecha_inicio} fechaFin={data.filtros.fecha_fin} />
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto_auto_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Banco</Label>
            <Select value={banco ?? TODOS} onValueChange={(v) => { setBanco(v === TODOS ? null : v); setIdCuenta(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los bancos</SelectItem>
                {(base?.bancos ?? []).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cuenta</Label>
            <Select value={idCuenta ?? TODOS} onValueChange={(v) => setIdCuenta(v === TODOS ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas las cuentas{banco ? ` de ${banco}` : ""}</SelectItem>
                {cuentasFiltro.map((c) => (
                  <SelectItem key={c.id_cuenta} value={c.id_cuenta} description={`${c.banco} · ${c.codigo_bc}`}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="desde">Desde</Label>
            <Input id="desde" type="month" value={desde} max={hasta} onChange={(e) => e.target.value && setDesde(e.target.value)} className="w-full lg:w-40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="hasta">Hasta</Label>
            <Input id="hasta" type="month" value={hasta} min={desde} onChange={(e) => e.target.value && setHasta(e.target.value)} className="w-full lg:w-40" />
          </div>
          <div className="flex flex-wrap gap-1.5 sm:col-span-2 lg:col-span-1">
            {p.map((x) => (
              <Button key={x.id} size="sm" variant={presetActivo === x.id ? "default" : "outline"} className="h-9" onClick={() => setRango(x.desde, x.hasta)}>
                {x.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error.message}
        </div>
      )}
      {!data ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <Contenido data={data} cuenta={cuenta} onCuenta={setIdCuenta} cargando={isFetching} />
      )}
    </div>
  );
}

function Contenido({ data, cuenta, onCuenta, cargando }: {
  data: DashboardResponse; cuenta: DashboardCuenta | null; onCuenta: (id: string | null) => void; cargando: boolean;
}) {
  const c = data.consolidado;
  const dif = cuenta ? cuenta.diferencia : c.diferencia_sin_explicar;
  const cuadre = cuenta ? cuenta.cuadre_saldos : c.cuadre_saldos;
  const sinCorte = cuenta ? (cuenta.tiene_corte ? 0 : 1) : c.cuentas_sin_corte;
  const parcialesPct = cuenta ? (cuenta.conciliados ? Math.round((cuenta.parciales / cuenta.conciliados) * 1000) / 10 : 0) : c.pct_parciales;
  const transito = data.antiguedad.reduce((s, a) => ({ n: s.n + a.n, monto: s.monto + a.monto }), { n: 0, monto: 0 });
  const titulo = cuenta ? cuenta.nombre : data.filtros.banco ? `Todas las cuentas de ${data.filtros.banco}` : "Todas las cuentas";
  const periodo = data.filtros.desde === data.filtros.hasta ? data.filtros.desde : `${data.filtros.desde} a ${data.filtros.hasta}`;

  const ingresos = useMemo(() => (cuenta ? [cuenta] : data.cuentas), [cuenta, data.cuentas]);

  return (
    <div className={cn("space-y-5 transition-opacity", cargando && "opacity-60")}>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{titulo}</span> · {periodo} · {data.cuentas.length} {data.cuentas.length === 1 ? "cuenta" : "cuentas"}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi titulo="% conciliado (por monto)" valor={pct(cuenta ? cuenta.pct_conciliado_monto : c.pct_conciliado_monto)}
             barra={cuenta ? cuenta.pct_conciliado_monto : c.pct_conciliado_monto}
             detalle={`${(cuenta ? cuenta.conciliados : c.conciliados).toLocaleString("es-EC")} de ${(cuenta ? cuenta.movimientos_banco : c.movimientos_banco).toLocaleString("es-EC")} movimientos`} />
        <Kpi titulo="Diferencia sin explicar" valor={formatMoney(dif)} estado={Math.abs(dif) < 0.005 ? "ok" : "bad"}
             detalle={Math.abs(dif) < 0.005 ? "Cuadra" : cuenta ? "Revisar la cuenta" : `${c.cuentas_con_diferencia} cuenta(s) no cuadran`} />
        <Kpi titulo="Partidas en tránsito" valor={formatMoneyCompact(transito.monto)} detalle={`${transito.n.toLocaleString("es-EC")} partidas`} />
        <Kpi titulo="Cruces parciales" valor={pct(parcialesPct)} detalle="Por monto y fecha (R2 + R3): revisar" />
        {cuenta ? (
          <Kpi titulo="Extracto cargado hasta" valor={fecha(cuenta.extracto_hasta).slice(0, 5)} estado={cuenta.extracto_al_dia ? undefined : "bad"}
               detalle={cuenta.extracto_al_dia ? "Al día" : `Atrasado · ${fecha(cuenta.extracto_hasta)}`} />
        ) : (
          <Kpi titulo="Extractos atrasados" valor={String(c.extractos_atrasados)} estado={c.extractos_atrasados ? "bad" : "ok"} detalle={`de ${c.cuentas} cuentas`} />
        )}
        {cuenta ? (
          <Kpi titulo="Último Auto-Match" valor={cuenta.auto_match.fecha ? cuenta.auto_match.fecha.slice(11, 16) : "—"}
               estado={cuenta.auto_match.error ? "bad" : undefined}
               detalle={cuenta.auto_match.fecha ? `${fecha(cuenta.auto_match.fecha)} · ${cuenta.auto_match.error ? "con errores" : "correcto"}` : "Aún no se ejecuta"} />
        ) : (
          <Kpi titulo="Auto-Match con error" valor={String(c.auto_match_con_error)} estado={c.auto_match_con_error ? "bad" : "ok"} detalle="última ejecución de cada cuenta" />
        )}
      </div>

      {/* Cuadre por saldos + ingresos y egresos */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Del saldo del banco al saldo de libros</CardTitle>
            <p className="text-xs text-muted-foreground">
              {cuadre ? `Al ${fecha(data.filtros.fecha_fin)} · desde el corte inicial${!cuenta && c.cuadre_saldos ? ` · ${c.cuadre_saldos.cuentas} cuenta(s)` : ""}` : "Necesita el corte inicial de la cuenta"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sinCorte > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2"><Flag className="mt-0.5 h-4 w-4 shrink-0" />
                  {cuenta ? "Falta el corte inicial: el cuadre por saldos no está disponible. Se muestra el cuadre del movimiento del periodo."
                    : `${sinCorte} de ${c.cuentas} cuentas sin corte inicial: no entran en este cuadre.`}
                </span>
                <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-500/40"><Link href="/cuentas">Registrar corte</Link></Button>
              </div>
            )}
            {cuadre ? (
              <>
                <Puente cuadre={cuadre} />
                <TablaPuente cuadre={cuadre} />
                {cuenta?.cuadre_saldos?.saldo_extracto != null && Math.abs(cuenta.cuadre_saldos.diferencia_extracto ?? 0) >= 0.005 && (
                  <p className="text-xs text-destructive">
                    El extracto reporta {formatMoney(cuenta.cuadre_saldos.saldo_extracto)} y el saldo calculado es {formatMoney(cuenta.cuadre_saldos.saldo_banco)}:
                    faltan o sobran movimientos del banco.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Eje desde el menor saldo para que se vean los ajustes.</p>
              </>
            ) : cuenta ? (
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-1.5">Movimiento neto del banco</td><td className="py-1.5 text-right font-mono">{formatMoney(cuenta.banco_ingresos + cuenta.banco_egresos)}</td></tr>
                  <tr className="border-b"><td className="py-1.5">Movimiento neto de BC</td><td className="py-1.5 text-right font-mono">{formatMoney(cuenta.bc_ingresos + cuenta.bc_egresos)}</td></tr>
                  <tr className="border-b"><td className="py-1.5">Pendientes del banco</td><td className="py-1.5 text-right font-mono">{formatMoney(cuenta.pendiente_banco_monto)}</td></tr>
                  <tr className="border-b"><td className="py-1.5">Pendientes de BC</td><td className="py-1.5 text-right font-mono">{formatMoney(cuenta.pendiente_bc_monto)}</td></tr>
                  <tr className="font-semibold"><td className="py-1.5">Diferencia sin explicar</td><td className="py-1.5 text-right font-mono">{formatMoney(cuenta.diferencia_movimiento)}</td></tr>
                </tbody>
              </table>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingresos y egresos: banco vs Business Central</CardTitle>
            <p className="text-xs text-muted-foreground">Sin reversos · ingresos = créditos del extracto / débitos de la cuenta de bancos en BC</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2f5d8a]" />Banco</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#3f8f75]" />Business Central</span>
            </div>
            {ingresos.slice(0, 8).map((x) => {
              // Escala propia de cada cuenta: lo que importa es banco frente a BC
              const max = Math.max(1, x.banco_ingresos, x.bc_ingresos, -x.banco_egresos, -x.bc_egresos);
              const fila = (v: number, color: string) => (
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: color }} /></div>
                  <span className="w-24 text-right font-mono text-[11px] tabular-nums">{formatMoneyCompact(v)}</span>
                </div>
              );
              return (
                <div key={x.id_cuenta} className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,10rem)_1fr]">
                  <button className="truncate text-left text-sm font-medium hover:underline" onClick={() => onCuenta(x.id_cuenta)} title={x.nombre}>{x.nombre}</button>
                  <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-0.5"><p className="text-[10px] uppercase text-muted-foreground">Ingresos</p>{fila(x.banco_ingresos, "#2f5d8a")}{fila(x.bc_ingresos, "#3f8f75")}</div>
                    <div className="space-y-0.5"><p className="text-[10px] uppercase text-muted-foreground">Egresos</p>{fila(x.banco_egresos, "#2f5d8a")}{fila(x.bc_egresos, "#3f8f75")}</div>
                  </div>
                </div>
              );
            })}
            {ingresos.length > 8 && <p className="text-xs text-muted-foreground">Se muestran 8 de {ingresos.length} cuentas; elija una cuenta para ver su detalle.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Antigüedad del tránsito</CardTitle>
            <p className="text-xs text-muted-foreground">Días al {fecha(data.filtros.fecha_fin)}</p></CardHeader>
          <CardContent>
            <BarrasHorizontales formato={(n) => n.toLocaleString("es-EC")}
              filas={data.antiguedad.map((a) => ({
                etiqueta: a.tramo === "61+" ? "Más de 60 días" : `${a.tramo.replace("-", " – ")} días`, valor: a.n,
                color: a.tramo === "0-30" ? "#1d7a3e" : a.tramo === "31-60" ? "#d9921a" : "#c81e2b", extra: `· ${formatMoneyCompact(a.monto)}`,
              }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Cruces por regla</CardTitle>
            <p className="text-xs text-muted-foreground">{data.reglas.reduce((s, r) => s + r.n, 0).toLocaleString("es-EC")} cruces en el periodo</p></CardHeader>
          <CardContent>
            <BarrasHorizontales
              filas={data.reglas.map((r) => {
                const cfg = getReglaConfig(r.regla);
                const parcial = r.regla === "REGLA_2_PARCIAL" || r.regla === "REGLA_4_SUBCONJUNTO_COMBINATORIO";
                const reverso = r.regla.startsWith("REGLA_REVERSO");
                return { etiqueta: cfg.shortLabel, valor: r.n, titulo: cfg.descripcion, color: parcial ? "#d9921a" : reverso ? "#9a948c" : "#2f9a5b" };
              })} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Por qué quedan pendientes</CardTitle>
            <p className="text-xs text-muted-foreground">Según el diagnóstico del reporte Detalle de cruces</p></CardHeader>
          <CardContent>
            <BarrasHorizontales filas={data.causas.map((x) => ({
              etiqueta: x.causa, valor: x.n,
              color: x.causa === "Sin contrapartida" ? "#9a948c" : x.causa === "Ya conciliado con otro" || x.causa === "Signo contrario" ? "#c81e2b" : "#d9921a",
            }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendencia · % conciliado</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 6 meses, por monto</p></CardHeader>
          <CardContent><Tendencia puntos={data.tendencia} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Estado por cuenta</CardTitle>
              {cuenta && <Button size="sm" variant="ghost" onClick={() => onCuenta(null)}>Ver todas</Button>}
            </div>
            <p className="text-xs text-muted-foreground">Clic en una cuenta para filtrar el dashboard</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left font-medium">Cuenta</th>
                  <th className="py-2 text-right font-medium">% conciliado</th>
                  <th className="py-2 text-right font-medium">Pendientes</th>
                  <th className="py-2 text-right font-medium">Sin explicar</th>
                  <th className="py-2 pl-3 text-left font-medium">Extracto</th>
                  <th className="py-2 text-left font-medium">Auto-Match</th>
                  <th className="py-2 text-left font-medium">Acta</th>
                </tr>
              </thead>
              <tbody>
                {data.cuentas.map((x) => (
                  <tr key={x.id_cuenta} onClick={() => onCuenta(x.id_cuenta)}
                      className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/50", cuenta?.id_cuenta === x.id_cuenta && "bg-muted/60")}>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2"><Semaforo s={x.semaforo} /><span className="truncate font-medium">{x.nombre}</span></div>
                      <div className="pl-[18px] text-xs text-muted-foreground">{x.banco} · {x.codigo_bc}{!x.tiene_corte && " · sin corte inicial"}</div>
                    </td>
                    <td className="py-2 text-right font-mono">{pct(x.pct_conciliado_monto)}</td>
                    <td className="py-2 text-right font-mono">{(x.pendientes_banco + x.pendientes_bc).toLocaleString("es-EC")}</td>
                    <td className={cn("py-2 text-right font-mono", Math.abs(x.diferencia) >= 0.005 && "text-destructive")}>{formatMoney(x.diferencia)}</td>
                    <td className="py-2 pl-3"><Badge variant="outline" className={cn("font-normal", !x.extracto_al_dia && "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300")}>{fecha(x.extracto_hasta)}</Badge></td>
                    <td className="py-2">
                      {x.auto_match.fecha ? (
                        <span className={cn("inline-flex items-center gap-1 text-xs", x.auto_match.error ? "text-destructive" : "text-green-700 dark:text-green-400")} title={x.auto_match.resultado}>
                          {x.auto_match.error ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{fecha(x.auto_match.fecha).slice(0, 5)}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 text-xs whitespace-nowrap">
                      {x.acta_estado === "CERRADO" ? "Cerrada" : x.acta_estado === "BORRADOR" ? "Borrador" : "Sin acta"}
                      {x.actas_anteriores_abiertas > 0 && (
                        <span className="mt-0.5 block text-amber-700 dark:text-amber-400" title="Actas de meses anteriores sin cerrar">
                          {x.actas_anteriores_abiertas} anterior{x.actas_anteriores_abiertas > 1 ? "es" : ""} abierta{x.actas_anteriores_abiertas > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {!data.cuentas.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No hay cuentas con ese filtro.</td></tr>}
              </tbody>
            </table>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Semaforo s="bad" /> Diferencia sin explicar o Auto-Match con error</span>
              <span className="flex items-center gap-1.5"><Semaforo s="warn" /> Extracto atrasado o acta anterior abierta</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pendientes más antiguos</CardTitle>
            <p className="text-xs text-muted-foreground">Por dónde empezar</p></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left font-medium">Fecha</th>
                  {!cuenta && <th className="py-2 text-left font-medium">Cuenta</th>}
                  <th className="py-2 text-left font-medium">Origen</th>
                  <th className="py-2 text-left font-medium">Referencia</th>
                  <th className="py-2 text-right font-medium">Monto</th>
                  <th className="py-2 text-right font-medium">Días</th>
                </tr>
              </thead>
              <tbody>
                {data.pendientes_antiguos.map((x, i) => (
                  <tr key={`${x.id_cuenta}-${x.referencia}-${i}`} className="border-b last:border-0" title={`${x.cuenta} · ${x.detalle}`}>
                    <td className="py-2 whitespace-nowrap">{fecha(x.fecha)}</td>
                    {!cuenta && <td className="max-w-[12rem] truncate py-2 pr-2">{x.cuenta}</td>}
                    <td className="py-2 whitespace-nowrap">{x.origen}</td>
                    <td className="max-w-[9rem] truncate py-2 font-mono text-xs">{x.referencia || "—"}</td>
                    <td className={cn("py-2 text-right font-mono whitespace-nowrap", x.monto < 0 && "text-destructive")}>{formatMoney(x.monto)}</td>
                    <td className="py-2 text-right">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold",
                        x.dias > 60 ? "bg-destructive/10 text-destructive" : x.dias > 30 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-muted")}>{x.dias}</span>
                    </td>
                  </tr>
                ))}
                {!data.pendientes_antiguos.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Sin pendientes.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
