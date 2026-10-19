"use client";

import { FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnviarReporteModal } from "./enviar-reporte-modal";
import { MoneyFormat } from "@/components/shared/money-format";
import { formatDate } from "@/lib/utils/format";

export interface ActaResumen {
  id_acta: string;
  banco: string;
  periodo_nombre: string;
  saldo_extracto: number;
  saldo_libros: number;
  diferencia: number;
  estado: "CUADRADO" | "DESCUADRADO";
  fecha_cierre: string;
}

interface ActasListProps {
  actas: ActaResumen[];
  isLoading?: boolean;
  userEmail?: string;
}

export function ActasList({
  actas = [],
  isLoading = false,
  userEmail = "",
}: ActasListProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Cargando historial de actas...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Historial de Actas e Informes de Conciliación
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y border-t text-xs font-mono">
          {actas.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay actas de conciliación cerradas registradas.
            </div>
          ) : (
            actas.map((acta) => (
              <div
                key={acta.id_acta}
                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Badge
                    variant={
                      acta.estado === "CUADRADO" ? "default" : "destructive"
                    }
                    className="shrink-0 gap-1 text-[10px]"
                  >
                    {acta.estado === "CUADRADO" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {acta.estado}
                  </Badge>

                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {acta.banco}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Período: {acta.periodo_nombre} • Cerrado el{" "}
                      {formatDate(acta.fecha_cierre)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-muted-foreground text-[10px]">
                      Diferencia
                    </p>
                    <MoneyFormat
                      value={acta.diferencia}
                      className="font-bold text-sm"
                    />
                  </div>

                  <EnviarReporteModal
                    idActa={acta.id_acta}
                    defaultEmail={userEmail}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
