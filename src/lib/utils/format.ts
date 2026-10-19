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

  const numValue = typeof value === "string" ? parseFloat(value) : (value ?? 0);

  if (isNaN(numValue)) return "$0.00";

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? "exceptZero" : "never",
  });

  return formatter.format(numValue);
}

export function formatMoneyCompact(
  value: number | string | null | undefined,
): string {
  const numValue = typeof value === "string" ? parseFloat(value) : (value ?? 0);

  if (isNaN(numValue)) return "$0";

  if (Math.abs(numValue) >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(numValue) >= 1_000) {
    return `$${(numValue / 1_000).toFixed(1)}K`;
  }
  return formatMoney(numValue, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
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
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Fecha inválida";
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
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Fecha inválida";

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

export function parseDateString(dateStr: string): Date | null {
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
  ];

  for (const format of formats) {
    if (format.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
}

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

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
