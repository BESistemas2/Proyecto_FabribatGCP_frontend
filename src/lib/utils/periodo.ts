// Periodos de conciliación: siempre meses completos (AAAA-MM-01 al último día del mes).

export const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const dos = (n: number) => String(n).padStart(2, "0");

/** Primer y último día del mes (mes 1-12) en formato AAAA-MM-DD. */
export function rangoDeMes(anio: number, mes: number): { inicio: string; fin: string } {
  const ultimo = new Date(anio, mes, 0).getDate();
  return { inicio: `${anio}-${dos(mes)}-01`, fin: `${anio}-${dos(mes)}-${dos(ultimo)}` };
}

/** Mes actual según el reloj local. */
export function mesActual(): { anio: number; mes: number } {
  const hoy = new Date();
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

/** Año y mes (1-12) de una fecha AAAA-MM-DD. */
export function mesDeFecha(fecha: string): { anio: number; mes: number } {
  return { anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)) };
}

/** Suma (o resta) meses. */
export function moverMes(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const total = anio * 12 + (mes - 1) + delta;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** true si el rango es exactamente un mes completo. */
export function esMesCompleto(inicio: string, fin: string): boolean {
  if (!inicio || !fin) return false;
  const { anio, mes } = mesDeFecha(inicio);
  const r = rangoDeMes(anio, mes);
  return r.inicio === inicio && r.fin === fin;
}

/** "Agosto 2026" */
export function nombreDeMes(anio: number, mes: number): string {
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}
