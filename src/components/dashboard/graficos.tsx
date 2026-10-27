"use client";

import { formatMoney, formatMoneyCompact } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CuadreSaldos } from "@/types/dashboard";

/** Barras horizontales simples (una fila por categoría). */
export function BarrasHorizontales({
  filas,
  formato = (n) => n.toLocaleString("es-EC"),
}: {
  filas: { etiqueta: string; valor: number; color?: string; extra?: string; titulo?: string }[];
  formato?: (n: number) => string;
}) {
  const max = Math.max(1, ...filas.map((f) => Math.abs(f.valor)));
  if (!filas.length) return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos en el periodo.</p>;
  return (
    <div className="space-y-2.5">
      {filas.map((f) => (
        <div key={f.etiqueta} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm" title={f.titulo}>
          <span className="truncate">{f.etiqueta}</span>
          <div className="h-3 overflow-hidden rounded bg-muted">
            <div className="h-full rounded" style={{ width: `${(Math.abs(f.valor) / max) * 100}%`, background: f.color || "hsl(var(--primary))" }} />
          </div>
          <span className="whitespace-nowrap text-right font-mono text-xs tabular-nums">
            {formato(f.valor)}
            {f.extra && <span className="ml-1 text-muted-foreground">{f.extra}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Línea de tendencia del % conciliado (0–100). */
export function Tendencia({ puntos }: { puntos: { etiqueta: string; pct: number | null }[] }) {
  const validos = puntos.filter((p) => p.pct !== null) as { etiqueta: string; pct: number }[];
  if (!validos.length) return <p className="py-6 text-center text-sm text-muted-foreground">Sin movimientos en los últimos meses.</p>;
  const W = 380, H = 170, x0 = 40, x1 = W - 16, y0 = 18, y1 = 140;
  const min = Math.max(0, Math.floor((Math.min(...validos.map((p) => p.pct)) - 5) / 10) * 10);
  const Y = (v: number) => y1 - ((v - min) / (100 - min)) * (y1 - y0);
  const X = (i: number) => (puntos.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (puntos.length - 1));
  const marcas = [min, min + (100 - min) / 2, 100];
  const linea = puntos.map((p, i) => (p.pct === null ? null : `${X(i)},${Y(p.pct)}`)).filter(Boolean).join(" ");
  const ultimo = puntos.map((p, i) => ({ etiqueta: p.etiqueta, pct: p.pct ?? 0, i, hay: p.pct !== null })).filter((p) => p.hay).at(-1)!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tendencia del porcentaje conciliado">
      {marcas.map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={Y(v)} y2={Y(v)} className="stroke-border" />
          <text x={x0 - 6} y={Y(v) + 3.5} textAnchor="end" className="fill-muted-foreground" fontSize="10">{Math.round(v)}%</text>
        </g>
      ))}
      <polyline points={linea} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" />
      {puntos.map((p, i) => (
        <g key={p.etiqueta}>
          {p.pct !== null && <circle cx={X(i)} cy={Y(p.pct)} r="3.5" fill="hsl(var(--primary))" />}
          <text x={X(i)} y={H - 10} textAnchor="middle" className="fill-muted-foreground" fontSize="10">{p.etiqueta}</text>
        </g>
      ))}
      <text x={X(ultimo.i)} y={Y(ultimo.pct) - 9} textAnchor="middle" fontSize="11" fontWeight="600" className="fill-foreground">
        {ultimo.pct.toLocaleString("es-EC")}%
      </text>
    </svg>
  );
}

/** Cascada del saldo del banco al saldo de libros. */
export function Puente({ cuadre }: { cuadre: CuadreSaldos }) {
  const pasos: { etiqueta: string; desde: number; hasta: number; total?: boolean }[] = [];
  let acum = cuadre.saldo_banco;
  pasos.push({ etiqueta: "Saldo banco", desde: 0, hasta: acum, total: true });
  const cortos: Record<string, string> = {
    CHEQUE_NO_COBRADO: "Cheques", NOTA_DEBITO_NO_REGISTRADA: "Notas débito", NOTA_CREDITO_NO_REGISTRADA: "Notas crédito",
    PENDIENTE_ACREDITAR: "Por acreditar", PENDIENTE_DEBITAR: "Por debitar",
  };
  for (const l of cuadre.lineas) {
    pasos.push({ etiqueta: cortos[l.clave] ?? l.nombre, desde: acum, hasta: acum + l.ajuste });
    acum += l.ajuste;
  }
  pasos.push({ etiqueta: "Saldo libros", desde: 0, hasta: cuadre.saldo_libros, total: true });

  const valores = pasos.flatMap((p) => (p.total ? [p.hasta] : [p.desde, p.hasta]));
  const lo0 = Math.min(...valores), hi0 = Math.max(...valores);
  const pad = (hi0 - lo0) * 0.15 || Math.abs(hi0) * 0.05 || 1;
  // El eje no parte de cero: así se ven ajustes pequeños frente a saldos grandes
  const lo = lo0 - pad, hi = hi0 + pad * 0.6;
  const W = 640, H = 230, x0 = 8, y0 = 22, y1 = 186;
  const bw = (W - x0 * 2) / pasos.length;
  const Y = (v: number) => y1 - ((Math.max(v, lo) - lo) / (hi - lo || 1)) * (y1 - y0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Del saldo del banco al saldo de libros">
      <line x1={x0} x2={W - x0} y1={y1} y2={y1} className="stroke-foreground" strokeWidth="0.8" />
      {pasos.map((p, i) => {
        const x = x0 + i * bw + bw * 0.18, w = bw * 0.64, cx = x + w / 2;
        const cero = !p.total && Math.abs(p.hasta - p.desde) < 0.005;
        const top = p.total ? Y(p.hasta) : Y(Math.max(p.desde, p.hasta));
        const bot = p.total ? y1 : Y(Math.min(p.desde, p.hasta));
        const color = p.total ? "hsl(var(--foreground))" : cero ? "hsl(var(--muted-foreground) / 0.4)" : p.hasta < p.desde ? "#c81e2b" : "#1d7a3e";
        const valor = p.total ? formatMoneyCompact(p.hasta) : cero ? "0" : `${p.hasta < p.desde ? "−" : "+"}${formatMoneyCompact(Math.abs(p.hasta - p.desde)).replace("-", "")}`;
        const [l1, l2] = p.etiqueta.split(" ");
        return (
          <g key={p.etiqueta}>
            <rect x={x} y={cero ? top - 0.6 : top} width={w} height={cero ? 1.2 : Math.max(bot - top, 1.2)} rx="2" fill={color} />
            {i > 0 && i < pasos.length && (
              <line x1={x - bw * 0.36} x2={x} y1={Y(pasos[i - 1].hasta)} y2={Y(pasos[i - 1].hasta)} className="stroke-muted-foreground" strokeWidth="0.6" strokeDasharray="2 2" />
            )}
            <text x={cx} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={p.total ? "currentColor" : color}>{valor}</text>
            <text x={cx} y={y1 + 15} textAnchor="middle" fontSize="10.5" className="fill-muted-foreground">{l1}</text>
            {l2 && <text x={cx} y={y1 + 28} textAnchor="middle" fontSize="10.5" className="fill-muted-foreground">{l2}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function TablaPuente({ cuadre }: { cuadre: CuadreSaldos }) {
  const ok = Math.abs(cuadre.diferencia) < 0.005;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th className="py-1.5 text-left font-medium">Concepto</th>
          <th className="py-1.5 text-right font-medium">Partidas</th>
          <th className="py-1.5 text-right font-medium">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b font-semibold"><td className="py-1.5">Saldo según estado de cuenta</td><td /><td className="py-1.5 text-right font-mono">{formatMoney(cuadre.saldo_banco)}</td></tr>
        {cuadre.lineas.map((l) => (
          <tr key={l.clave} className={cn("border-b", !l.n && "text-muted-foreground")}>
            <td className="py-1.5"><span className="inline-block w-4 font-semibold">{l.signo > 0 ? "+" : "−"}</span>{l.nombre}</td>
            <td className="py-1.5 text-right text-xs">{l.n || ""}</td>
            <td className={cn("py-1.5 text-right font-mono", l.ajuste < 0 && "text-destructive")}>{formatMoney(l.ajuste)}</td>
          </tr>
        ))}
        <tr className="border-b bg-muted/40 font-semibold"><td className="py-1.5 pl-1">Saldo de libros calculado</td><td /><td className="py-1.5 text-right font-mono">{formatMoney(cuadre.saldo_libros_calculado)}</td></tr>
        <tr className="border-b"><td className="py-1.5">Saldo según libro bancos</td><td /><td className="py-1.5 text-right font-mono">{formatMoney(cuadre.saldo_libros)}</td></tr>
        <tr className={cn("font-semibold", ok ? "text-green-700 dark:text-green-400" : "text-destructive")}>
          <td className="py-1.5">Diferencia</td><td /><td className="py-1.5 text-right font-mono">{formatMoney(cuadre.diferencia)}</td>
        </tr>
      </tbody>
    </table>
  );
}
