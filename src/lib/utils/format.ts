/** Convierte números o textos numéricos de la API (Decimal llega como string) a number. */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Suma montos en centavos para evitar errores de coma flotante (0.1 + 0.2). */
export function sumarMontos<T>(items: T[], obtener: (item: T) => number | string | null | undefined): number {
  return items.reduce((acc, it) => acc + Math.round(toNumber(obtener(it)) * 100), 0) / 100;
}

/**
 * Convierte fechas de la API a Date sin corrimiento de zona horaria:
 * - "AAAA-MM-DD" se interpreta como fecha LOCAL (new Date() la tomaría como UTC y en
 *   Ecuador mostraría el día anterior).
 * - "AAAA-MM-DDTHH:mm:ss" sin zona se interpreta como hora local (así la guarda el backend).
 * - "dd/mm/aaaa" también se acepta.
 */
export function parseFecha(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = value.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatMoney(
  value: number | string | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSign?: boolean;
  } = {},
): string {
  const {
    currency = "USD",
    locale = "es-EC",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false,
  } = options;

  const numValue = toNumber(value);

  // "auto" muestra el signo menos de los débitos; "exceptZero" agrega además el "+"
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? "exceptZero" : "auto",
  });

  return formatter.format(numValue);
}

export function formatMoneyCompact(
  value: number | string | null | undefined,
): string {
  const numValue = toNumber(value);
  const signo = numValue < 0 ? "-" : "";
  const abs = Math.abs(numValue);

  if (abs >= 1_000_000) return `${signo}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${signo}$${(abs / 1_000).toFixed(1)}K`;
  return formatMoney(numValue, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** @deprecated usar formatMoney (se mantiene por compatibilidad: mismo formato es-EC). */
export function formatCurrency(amount: number | string): string {
  return formatMoney(amount);
}

export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
  locale = "es-EC",
): string {
  if (!date) return "—";
  const d = parseFecha(date);
  if (!d) return "Fecha inválida";
  return d.toLocaleDateString(locale, options);
}

export function formatDateTime(
  date: string | Date | null | undefined,
  locale = "es-EC",
): string {
  return formatDate(
    date,
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    locale,
  );
}

export function formatRelativeTime(
  date: string | Date | null | undefined,
): string {
  const d = parseFecha(date);
  if (!d) return "—";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return formatDate(d);
}

/** @deprecated usar parseFecha. */
export function parseDateString(dateStr: string): Date | null {
  return parseFecha(dateStr);
}

/** "AAAA-MM-DD" -> Date local. */
export const parseLocalDate = (dateStr: string): Date => parseFecha(dateStr) ?? new Date(NaN);

export function getPeriodoLabel(fechaInicio: string, fechaFin: string): string {
  if (!fechaInicio || !fechaFin) return "Seleccionar período";

  const start = parseLocalDate(fechaInicio);
  const end = parseLocalDate(fechaFin);

  const d1 = String(start.getDate()).padStart(2, "0");
  const d2 = String(end.getDate()).padStart(2, "0");

  const meses = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sept",
    "oct",
    "nov",
    "dic",
  ];

  const m1 = meses[start.getMonth()];
  const m2 = meses[end.getMonth()];
  const y1 = start.getFullYear();
  const y2 = end.getFullYear();

  // Mismo mes y mismo año -> "01 - 21 sept 2026"
  if (m1 === m2 && y1 === y2) {
    return `${d1} - ${d2} ${m1} ${y1}`;
  }

  // Distinto mes, mismo año -> "25 ago - 10 sept 2026"
  if (y1 === y2) {
    return `${d1} ${m1} - ${d2} ${m2} ${y1}`;
  }

  // Años distintos -> "25 dic 2025 - 05 ene 2026"
  return `${d1} ${m1} ${y1} - ${d2} ${m2} ${y2}`;
}
