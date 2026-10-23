"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { conciliacionApi } from "@/lib/api/conciliacion";

interface DetalleCrucesButtonProps {
  idCuenta?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  size?: ButtonProps["size"];
  className?: string;
}

/**
 * Descarga el Excel "Detalle de cruces" de una cuenta y periodo: qué movimiento del banco
 * cruzó con qué asiento de BC (y con qué regla), los reversos y los pendientes con la
 * observación de por qué no cruzaron. Solo lectura.
 */
export function DetalleCrucesButton({ idCuenta, fechaInicio, fechaFin, size = "sm", className }: DetalleCrucesButtonProps) {
  const { toast } = useToast();
  const [descargando, setDescargando] = useState(false);
  const listo = !!idCuenta && !!fechaInicio && !!fechaFin;

  const descargar = async () => {
    if (!listo) return;
    setDescargando(true);
    try {
      await conciliacionApi.descargarDetalleCruces(idCuenta!, fechaInicio!, fechaFin!);
    } catch {
      toast({
        title: "No se pudo generar el reporte",
        description: "Intente de nuevo en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      className={className ?? "gap-2"}
      onClick={descargar}
      disabled={!listo || descargando}
      title="Excel con cada cruce banco ↔ BC, la regla aplicada y por qué quedaron los pendientes"
    >
      {descargando ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-primary" />
      )}
      Detalle de cruces
    </Button>
  );
}
