"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock, Plus, Save, Trash2, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCorteInicial, useGuardarCorteInicial } from "@/lib/hooks/use-conciliacion";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CATEGORIAS_PARTIDA, type CategoriaPartida } from "@/types/dashboard";
import type { CuentaBancaria } from "@/types/bancos";

interface Props {
  cuenta: CuentaBancaria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Fila {
  key: number;
  categoria: CategoriaPartida;
  fecha: string;
  detalle: string;
  referencia: string;
  valor: string;
  observacion: string;
}

let siguiente = 1;
const filaVacia = (fecha = ""): Fila => ({
  key: siguiente++, categoria: "CHEQUE_NO_COBRADO", fecha, detalle: "", referencia: "", valor: "", observacion: "",
});

/** Acepta "1.234,56", "1234.56" o "1234,56". Devuelve null si no es un número. */
export function leerMonto(texto: string): number | null {
  let t = (texto || "").replace(/[\s$]/g, "");
  if (!t) return null;
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = t.replace(",", ".");
  else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, ""); // 1.234.567 = miles
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

const aTexto = (v: number | string) =>
  Number(v).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


export function CorteInicialDrawer({ cuenta, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { puedeOperar } = useAuth();
  const idCuenta = cuenta?.id_cuenta ?? "";
  const { data: corte, isLoading } = useCorteInicial(idCuenta, open);
  const guardar = useGuardarCorteInicial(idCuenta);

  const [fechaCorte, setFechaCorte] = useState("");
  const [saldoBanco, setSaldoBanco] = useState("");
  const [saldoLibros, setSaldoLibros] = useState("");
  const [observacion, setObservacion] = useState("");
  const [filas, setFilas] = useState<Fila[]>([]);

  // Cargar lo guardado (o un formulario vacío) cada vez que se abre
  useEffect(() => {
    if (!open || isLoading) return;
    if (corte) {
      setFechaCorte(corte.fecha_corte);
      setSaldoBanco(aTexto(corte.saldo_banco));
      setSaldoLibros(aTexto(corte.saldo_libros));
      setObservacion(corte.observacion || "");
      setFilas(corte.partidas.map((p) => ({
        key: siguiente++, categoria: p.categoria, fecha: p.fecha, detalle: p.detalle,
        referencia: p.referencia || "", valor: aTexto(p.valor), observacion: p.observacion || "",
      })));
    } else {
      setFechaCorte(""); setSaldoBanco(""); setSaldoLibros(""); setObservacion(""); setFilas([]);
    }
  }, [open, isLoading, corte]);

  const bloqueado = !!corte?.bloqueado || !puedeOperar;

  const cuadre = useMemo(() => {
    const banco = leerMonto(saldoBanco);
    const libros = leerMonto(saldoLibros);
    const porCategoria = CATEGORIAS_PARTIDA.map((c) => {
      const items = filas.filter((f) => f.categoria === c.value);
      const total = items.reduce((s, f) => s + (leerMonto(f.valor) ?? 0), 0);
      return { ...c, n: items.length, total: Math.round(total * 100) / 100 };
    });
    const calculado = banco === null ? null
      : Math.round((banco + porCategoria.reduce((s, c) => s + c.signo * c.total, 0)) * 100) / 100;
    const diferencia = calculado === null || libros === null ? null : Math.round((calculado - libros) * 100) / 100;
    return { banco, libros, porCategoria, calculado, diferencia };
  }, [saldoBanco, saldoLibros, filas]);

  const errores = useMemo(() => {
    const e: string[] = [];
    if (!fechaCorte) e.push("Indique la fecha del corte.");
    if (cuadre.banco === null) e.push("Indique el saldo según el estado de cuenta.");
    if (cuadre.libros === null) e.push("Indique el saldo según el libro bancos.");
    filas.forEach((f, i) => {
      if (!f.fecha || !f.detalle.trim() || !(leerMonto(f.valor)! > 0)) e.push(`Partida ${i + 1}: complete fecha, detalle y un valor mayor a 0.`);
      else if (fechaCorte && f.fecha > fechaCorte) e.push(`Partida ${i + 1}: la fecha es posterior al corte.`);
    });
    return e;
  }, [fechaCorte, cuadre.banco, cuadre.libros, filas]);

  const cuadra = cuadre.diferencia === 0;
  const puedeGuardar = !bloqueado && errores.length === 0 && cuadra && !guardar.isPending;

  const actualizar = (key: number, cambios: Partial<Fila>) =>
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, ...cambios } : f)));

  const onGuardar = async () => {
    try {
      await guardar.mutateAsync({
        fecha_corte: fechaCorte,
        saldo_banco: cuadre.banco!,
        saldo_libros: cuadre.libros!,
        observacion: observacion.trim() || null,
        partidas: filas.map((f) => ({
          categoria: f.categoria, fecha: f.fecha, detalle: f.detalle.trim(),
          referencia: f.referencia.trim() || null, valor: leerMonto(f.valor)!, observacion: f.observacion.trim() || null,
        })),
      });
      toast({ title: "Corte inicial guardado", description: `${(cuenta?.alias || cuenta?.banco_nombre)} · al ${fechaCorte}`, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "No se guardó el corte", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent size="4xl">
        <DrawerHeader className="border-b p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="text-lg font-semibold">Corte inicial</DrawerTitle>
              <p className="truncate text-sm text-muted-foreground">
                {(cuenta?.alias || cuenta?.banco_nombre)} · {cuenta?.codigo_banco_bc}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Datos de la última acta cerrada fuera del sistema: los saldos a la fecha de corte y las partidas que
                seguían en tránsito. Desde aquí el sistema arrastra los pendientes mes a mes.
              </p>
              {corte?.bloqueado && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Solo lectura. {corte.motivo_bloqueo}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fecha-corte">Fecha del corte</Label>
                  <Input id="fecha-corte" type="date" value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} disabled={bloqueado} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="saldo-banco">Saldo según estado de cuenta</Label>
                  <Input id="saldo-banco" inputMode="decimal" placeholder="0,00" value={saldoBanco}
                         onChange={(e) => setSaldoBanco(e.target.value)} disabled={bloqueado} className="text-right font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="saldo-libros">Saldo según libro bancos</Label>
                  <Input id="saldo-libros" inputMode="decimal" placeholder="0,00" value={saldoLibros}
                         onChange={(e) => setSaldoLibros(e.target.value)} disabled={bloqueado} className="text-right font-mono" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Partidas en tránsito al corte ({filas.length})</h3>
                  {!bloqueado && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFilas((p) => [...p, filaVacia(fechaCorte)])}>
                      <Plus className="h-3.5 w-3.5" /> Agregar partida
                    </Button>
                  )}
                </div>
                {filas.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Sin partidas. Si al corte no había nada en tránsito, los dos saldos deben ser iguales.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filas.map((f, i) => (
                      <div key={f.key} className="grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-12">
                        <div className="md:col-span-4">
                          <Label className="text-xs text-muted-foreground">Tipo</Label>
                          <Select value={f.categoria} onValueChange={(v) => actualizar(f.key, { categoria: v as CategoriaPartida })} disabled={bloqueado}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS_PARTIDA.map((c) => (
                                <SelectItem key={c.value} value={c.value} description={c.ayuda}>
                                  {c.signo > 0 ? "(+)" : "(−)"} {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs text-muted-foreground">Fecha</Label>
                          <Input type="date" className="h-9" value={f.fecha} onChange={(e) => actualizar(f.key, { fecha: e.target.value })} disabled={bloqueado} />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs text-muted-foreground">Beneficiario / detalle</Label>
                          <Input className="h-9" maxLength={255} value={f.detalle} onChange={(e) => actualizar(f.key, { detalle: e.target.value })} disabled={bloqueado} />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs text-muted-foreground">Valor</Label>
                          <Input className="h-9 text-right font-mono" inputMode="decimal" placeholder="0,00" value={f.valor}
                                 onChange={(e) => actualizar(f.key, { valor: e.target.value })} disabled={bloqueado} />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs text-muted-foreground">Referencia / N° de cheque</Label>
                          <Input className="h-9" maxLength={100} value={f.referencia} onChange={(e) => actualizar(f.key, { referencia: e.target.value })} disabled={bloqueado} />
                        </div>
                        <div className="md:col-span-7">
                          <Label className="text-xs text-muted-foreground">Observación</Label>
                          <Input className="h-9" maxLength={255} value={f.observacion} onChange={(e) => actualizar(f.key, { observacion: e.target.value })} disabled={bloqueado} />
                        </div>
                        <div className="flex items-end justify-end md:col-span-1">
                          {!bloqueado && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                    onClick={() => setFilas((p) => p.filter((x) => x.key !== f.key))} aria-label={`Quitar partida ${i + 1}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border">
                <div className="border-b bg-muted/40 px-3 py-2 text-sm font-semibold">Cuadre del corte</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b"><td className="px-3 py-1.5">Saldo según estado de cuenta</td><td /><td className="px-3 py-1.5 text-right font-mono">{cuadre.banco === null ? "—" : formatMoney(cuadre.banco)}</td></tr>
                    {cuadre.porCategoria.map((c) => (
                      <tr key={c.value} className={cn("border-b", !c.n && "text-muted-foreground")}>
                        <td className="px-3 py-1.5"><span className="inline-block w-5 font-semibold">{c.signo > 0 ? "+" : "−"}</span>{c.label}</td>
                        <td className="px-3 py-1.5 text-right text-xs text-muted-foreground">{c.n || ""}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatMoney(c.signo * c.total || 0)}</td>
                      </tr>
                    ))}
                    <tr className="border-b bg-muted/30 font-semibold"><td className="px-3 py-1.5">Saldo de libros calculado</td><td /><td className="px-3 py-1.5 text-right font-mono">{cuadre.calculado === null ? "—" : formatMoney(cuadre.calculado)}</td></tr>
                    <tr className="border-b"><td className="px-3 py-1.5">Saldo según libro bancos</td><td /><td className="px-3 py-1.5 text-right font-mono">{cuadre.libros === null ? "—" : formatMoney(cuadre.libros)}</td></tr>
                    <tr className={cn("font-semibold", cuadra ? "text-green-700 dark:text-green-400" : cuadre.diferencia !== null && "text-destructive")}>
                      <td className="px-3 py-2">Diferencia</td><td />
                      <td className="px-3 py-2 text-right font-mono">{cuadre.diferencia === null ? "—" : formatMoney(cuadre.diferencia)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obs-corte">Observación (opcional)</Label>
                <Textarea id="obs-corte" rows={2} maxLength={500} value={observacion} onChange={(e) => setObservacion(e.target.value)} disabled={bloqueado}
                          placeholder="Ej.: tomado del acta de septiembre 2026 firmada por contabilidad" />
              </div>

              {!bloqueado && (cuadre.diferencia !== null || errores.length > 0) && (
                <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm",
                  errores.length === 0 && cuadra ? "border-green-600/30 bg-green-600/10 text-green-800 dark:text-green-300" : "border-destructive/30 bg-destructive/10 text-destructive")}>
                  {errores.length === 0 && cuadra ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div>
                    {errores.length === 0 && cuadra && "El corte cuadra: ya se puede guardar."}
                    {errores.length === 0 && !cuadra && cuadre.diferencia !== null && `El corte no cuadra por ${formatMoney(cuadre.diferencia)}. Revise los saldos y las partidas.`}
                    {errores.slice(0, 4).map((e) => <p key={e}>{e}</p>)}
                  </div>
                </div>
              )}
              {corte && (
                <p className="text-xs text-muted-foreground">
                  Registrado por {corte.creado_por}{corte.actualizado_por ? ` · última edición de ${corte.actualizado_por}` : ""}.
                </p>
              )}
            </>
          )}
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{bloqueado ? "Cerrar" : "Cancelar"}</Button>
          {!bloqueado && (
            <Button onClick={onGuardar} disabled={!puedeGuardar} className="gap-2">
              {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar corte
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
