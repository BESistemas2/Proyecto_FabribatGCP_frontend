import type { CuentaBancaria } from "@/types/bancos";

const DIAS = { DIARIA: "Diario", SEMANAL: "Lunes", MENSUAL: "Día 1 de cada mes" } as const;

/** Mismas reglas que el programador del backend (app/modulos/conciliacion/auto_match.py). */
export function describirFrecuencia(c: Pick<CuentaBancaria, "auto_match_frecuencia" | "auto_match_hora" | "auto_match_hora_ejecucion" | "auto_match_intervalo_minutos">): string {
  const frecuencia = c.auto_match_frecuencia ?? "DIARIA";
  const hora = (c.auto_match_hora || c.auto_match_hora_ejecucion || "04:00").slice(0, 5);
  const intervalo = c.auto_match_intervalo_minutos ?? 1440;
  if (frecuencia === "DIARIA" && intervalo < 1440) {
    const cada = intervalo % 60 === 0 ? `${intervalo / 60} h` : `${intervalo} min`;
    return `Diario desde ${hora}, cada ${cada}`;
  }
  return `${DIAS[frecuencia] ?? "Diario"} · ${hora}`;
}

export function resumenUltimaEjecucion(c: Pick<CuentaBancaria, "auto_match_ultima_ejecucion" | "auto_match_ultimo_resultado">): {
  texto: string;
  error: boolean;
} {
  if (!c.auto_match_ultima_ejecucion) return { texto: "Aún no se ha ejecutado", error: false };
  const fecha = new Date(c.auto_match_ultima_ejecucion);
  const cuando = Number.isNaN(fecha.getTime())
    ? c.auto_match_ultima_ejecucion
    : fecha.toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const resultado = c.auto_match_ultimo_resultado || "";
  const error = resultado.startsWith("ERROR");
  return { texto: `${cuando} · ${error ? "con errores" : "correcta"}`, error };
}
