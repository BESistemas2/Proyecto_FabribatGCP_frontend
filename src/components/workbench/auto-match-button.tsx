"use client";

import { Button } from "@/components/ui/button";
import { useEjecutarAutoMatch } from "@/lib/hooks/use-conciliacion";
import { cn } from "@/lib/utils/cn";
import { Loader2, Zap } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

interface AutoMatchButtonProps {
  idCuenta: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  cuentaContable?: string;
  creadoPor: string;
  disabled?: boolean;
  totalMovimientos?: number;
}

export function AutoMatchButton({
  idCuenta,
  periodo,
  fechaInicio,
  fechaFin,
  cuentaContable,
  creadoPor,
  disabled,
  totalMovimientos = 0,
}: AutoMatchButtonProps) {
  const { toast } = useToast();
  const mutation = useEjecutarAutoMatch();

  const handleClick = () => {
    if (!idCuenta || !fechaInicio || !fechaFin) return;

    mutation.mutate(
      {
        payload: {
          id_cuenta: idCuenta,
          periodo,
          creado_por: creadoPor,
          cuenta_contable: cuentaContable || "",
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
        fechaInicio,
        fechaFin,
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Auto-Match completado",
            description: `Se conciliaron ${data.total_conciliado} movimientos. Acta ${data.id_acta} generada.`,
            variant: "success",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error en Auto-Match",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const isPending = mutation.isPending;

  return (
    <Button
      onClick={() => {
        if (!idCuenta || !fechaInicio || !fechaFin) return;
        mutation.mutate(
          {
            payload: {
              id_cuenta: idCuenta,
              periodo,
              creado_por: creadoPor,
              cuenta_contable: cuentaContable || "",
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
            },
            fechaInicio,
            fechaFin,
          },
          {
            onSuccess: (data) => {
              toast({
                title: "Auto-Match completado",
                description: `Se conciliaron ${data.total_conciliado} movimientos. Acta ${data.id_acta} generada.`,
                variant: "success",
              });
            },
            onError: (error: Error) => {
              toast({
                title: "Error en Auto-Match",
                description: error.message,
                variant: "destructive",
              });
            },
          }
        );
      }}
      disabled={
        disabled ||
        mutation.isPending ||
        !idCuenta ||
        !fechaInicio ||
        !fechaFin
      }
      className={cn(
        "w-full sm:w-auto gap-2 font-semibold text-lg px-6 py-3 shadow-md transition-all",
        "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground",
      )}
    >
      <Zap className="h-5 w-5 fill-current" />
      {mutation.isPending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Ejecutando cruce...
        </>
      ) : (
        <>
          <Zap className="h-5 w-5 fill-current" />
          Ejecutar Auto-Match
        </>
      )}
    </Button>
  );
}