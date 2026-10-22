"use client";

import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface AutoMatchButtonProps {
  onClick: () => void;
  isPending: boolean;
  disabled?: boolean;
  /** Motivo por el que está deshabilitado (se muestra como tooltip) */
  motivo?: string;
}

/** Botón del cruce automático. La mutación vive en la página para compartir su estado. */
export function AutoMatchButton({ onClick, isPending, disabled, motivo }: AutoMatchButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isPending}
      title={motivo}
      className={cn(
        "w-full shrink-0 gap-2 font-semibold shadow-sm sm:w-auto",
        "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground",
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Ejecutando cruce...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4 fill-current" />
          Ejecutar Auto-Match
        </>
      )}
    </Button>
  );
}
