"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Banknote,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { getPeriodoLabel } from "@/lib/utils/format";
import { CuentaBancaria } from "@/types/bancos";

interface AccountPeriodSelectorProps {
  cuentas: CuentaBancaria[];
  selectedCuentaId: string | null;
  fechaInicio: string;
  fechaFin: string;
  onCuentaChange: (id: string) => void;
  onPeriodoChange: (inicio: string, fin: string) => void;
  disabled?: boolean;
}

type ActiveDropdown = "cuenta" | "periodo" | null;

export function AccountPeriodSelector({
  cuentas,
  selectedCuentaId,
  fechaInicio,
  fechaFin,
  onCuentaChange,
  onPeriodoChange,
  disabled = false,
}: AccountPeriodSelectorProps) {
  // Estado único y exclusivo: solo un desplegable puede existir en el DOM a la vez
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

  // Estados temporales de fechas
  const [tempInicio, setTempInicio] = useState(fechaInicio);
  const [tempFin, setTempFin] = useState(fechaFin);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar fechas temporales cuando cambien las props
  useEffect(() => {
    setTempInicio(fechaInicio);
    setTempFin(fechaFin);
  }, [fechaInicio, fechaFin]);

  // Cierre garantizado al hacer clic fuera del contenedor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cuentaSeleccionada = cuentas.find(
    (c) => c.id_cuenta === selectedCuentaId,
  );

  // Manejador de cambio de cuenta con cierre instantáneo
  const handleSelectCuenta = (id: string) => {
    setActiveDropdown(null);
    onCuentaChange(id);
  };

  // Formateadores de fecha local
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const handleDateSelect = (date: Date | undefined, type: "inicio" | "fin") => {
    if (!date) return;
    const formatted = formatLocalDate(date);
    if (type === "inicio") {
      setTempInicio(formatted);
    } else {
      setTempFin(formatted);
    }
  };

  const handleAplicar = () => {
    setActiveDropdown(null);
    onPeriodoChange(tempInicio, tempFin);
  };

  const handleLimpiar = () => {
    setTempInicio("");
    setTempFin("");
    setActiveDropdown(null);
    onPeriodoChange("", "");
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full"
    >
      {/* 1. Desplegable de Selección de Cuenta */}
      <div className="relative w-full sm:w-[360px]">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setActiveDropdown(activeDropdown === "cuenta" ? null : "cuenta")
          }
          className="w-full justify-between h-auto py-2 px-3 text-left font-normal"
          disabled={disabled || cuentas.length === 0}
        >
          {cuentaSeleccionada ? (
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span className="font-medium flex items-center gap-2 text-sm truncate">
                <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                {cuentaSeleccionada.alias ||
                  cuentaSeleccionada.banco_nombre} —{" "}
                {cuentaSeleccionada.numero_cuenta}
              </span>
              <span className="text-xs text-muted-foreground pl-6 truncate">
                {cuentaSeleccionada.banco_nombre} • {cuentaSeleccionada.moneda}{" "}
                • CC: {cuentaSeleccionada.cuenta_contable_bc}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {cuentas.length === 0
                ? "Sincronice catálogo desde Configuración"
                : "Seleccionar cuenta bancaria"}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {activeDropdown === "cuenta" && (
          <div className="absolute top-full left-0 mt-2 z-50 w-full max-h-[300px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-1">
              {cuentas.map((cuenta) => {
                const isSelected = cuenta.id_cuenta === selectedCuentaId;
                return (
                  <button
                    key={cuenta.id_cuenta}
                    type="button"
                    onClick={() => handleSelectCuenta(cuenta.id_cuenta)}
                    className={cn(
                      "w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between gap-2 text-sm",
                      isSelected && "bg-accent/80 font-medium",
                    )}
                  >
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="font-medium flex items-center gap-2 truncate">
                        <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {cuenta.alias || cuenta.banco_nombre} —{" "}
                        {cuenta.numero_cuenta}
                      </span>
                      <span className="text-xs text-muted-foreground pl-6 truncate">
                        {cuenta.banco_nombre} • {cuenta.moneda} • CC:{" "}
                        {cuenta.cuenta_contable_bc}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Desplegable de Selección de Período (Fechas) */}
      <div className="relative w-full sm:w-[320px]">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setActiveDropdown(activeDropdown === "periodo" ? null : "periodo")
          }
          className={cn(
            "w-full justify-between h-auto py-2.5 px-3 font-normal",
            (!fechaInicio || !fechaFin) && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {fechaInicio && fechaFin
                ? getPeriodoLabel(fechaInicio, fechaFin)
                : "Seleccionar período"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {activeDropdown === "periodo" && (
          <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex gap-4 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Fecha Inicio
                </p>
                <CalendarComponent
                  mode="single"
                  selected={parseLocalDate(tempInicio)}
                  onSelect={(date) => handleDateSelect(date, "inicio")}
                  disabled={disabled}
                />
              </div>
              <Separator orientation="vertical" className="my-2" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Fecha Fin
                </p>
                <CalendarComponent
                  mode="single"
                  selected={parseLocalDate(tempFin)}
                  onSelect={(date) => handleDateSelect(date, "fin")}
                  disabled={disabled}
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-2 p-2 bg-muted/20 rounded-b-md">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleLimpiar}
                disabled={disabled}
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={handleAplicar}
                disabled={disabled}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
