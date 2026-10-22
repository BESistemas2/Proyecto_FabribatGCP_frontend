"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  Save,
  ChevronDown,
  Check,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { describirFrecuencia } from "@/lib/utils/auto-match";
import { CuentaBancaria, CuentaBancariaUpdate } from "@/types/bancos";
import { useUpdateCuentaBancaria } from "@/lib/hooks/use-bancos";
import { useToast } from "@/lib/hooks/use-toast";

const configSchema = z.object({
  rpa_habilitado: z.boolean(),
  auto_match_habilitado: z.boolean(),
  rpa_frecuencia: z.enum(["DIARIA", "SEMANAL", "MENSUAL"]),
  rpa_hora_ejecucion: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido"),
  rpa_intervalo_minutos: z.coerce
    .number()
    .min(15, "Mínimo 15 minutos")
    .max(1440, "Máximo 1440 minutos (24h)"),
  auto_match_frecuencia: z.enum(["DIARIA", "SEMANAL", "MENSUAL"]),
  auto_match_hora_ejecucion: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido"),
  auto_match_intervalo_minutos: z.coerce
    .number()
    .min(15, "Mínimo 15 minutos")
    .max(1440, "Máximo 1440 minutos (24h)"),
  auto_match_enviar_correo: z.boolean(),
  activo: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface CuentaConfigDrawerProps {
  cuenta: CuentaBancaria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FRECUENCIA_OPTIONS = [
  { value: "DIARIA", label: "Diaria" },
  { value: "SEMANAL", label: "Semanal (lunes)" },
  { value: "MENSUAL", label: "Mensual (día 1)" },
] as const;

const DEFAULT_RPA_HORA = "02:00";
const DEFAULT_AUTO_MATCH_HORA = "04:00";
const DEFAULT_INTERVALO = 1440;

export function CuentaConfigDrawer({
  cuenta,
  open,
  onOpenChange,
}: CuentaConfigDrawerProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateCuentaBancaria();
  const isSubmitting = updateMutation.isPending;

  const [openRpaFrecuencia, setOpenRpaFrecuencia] = useState(false);
  const [openAutoMatchFrecuencia, setOpenAutoMatchFrecuencia] = useState(false);

  const rpaFrecuenciaRef = useRef<HTMLDivElement>(null);
  const autoMatchFrecuenciaRef = useRef<HTMLDivElement>(null);

  // Cierre garantizado al hacer clic fuera de los desplegables
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rpaFrecuenciaRef.current &&
        !rpaFrecuenciaRef.current.contains(event.target as Node)
      ) {
        setOpenRpaFrecuencia(false);
      }
      if (
        autoMatchFrecuenciaRef.current &&
        !autoMatchFrecuenciaRef.current.contains(event.target as Node)
      ) {
        setOpenAutoMatchFrecuencia(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      rpa_habilitado: false,
      auto_match_habilitado: false,
      rpa_frecuencia: "DIARIA",
      rpa_hora_ejecucion: DEFAULT_RPA_HORA,
      rpa_intervalo_minutos: DEFAULT_INTERVALO,
      auto_match_frecuencia: "DIARIA",
      auto_match_hora_ejecucion: DEFAULT_AUTO_MATCH_HORA,
      auto_match_intervalo_minutos: DEFAULT_INTERVALO,
      auto_match_enviar_correo: true,
      activo: true,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (cuenta) {
      form.reset({
        rpa_habilitado: cuenta.rpa_habilitado,
        auto_match_habilitado: cuenta.auto_match_habilitado,
        rpa_frecuencia: cuenta.rpa_frecuencia || "DIARIA",
        rpa_hora_ejecucion: (cuenta.rpa_hora_ejecucion || DEFAULT_RPA_HORA).slice(0, 5),
        rpa_intervalo_minutos:
          cuenta.rpa_intervalo_minutos || DEFAULT_INTERVALO,
        auto_match_frecuencia:
          cuenta.auto_match_frecuencia ?? cuenta.rpa_frecuencia ?? "DIARIA",
        auto_match_hora_ejecucion:
          (cuenta.auto_match_hora || cuenta.auto_match_hora_ejecucion || DEFAULT_AUTO_MATCH_HORA).slice(0, 5),
        auto_match_intervalo_minutos:
          cuenta.auto_match_intervalo_minutos ??
          cuenta.rpa_intervalo_minutos ??
          DEFAULT_INTERVALO,
        auto_match_enviar_correo: cuenta.auto_match_enviar_correo ?? true,
        activo: cuenta.activo ?? true,
      });
    }
  }, [cuenta, form]);

  const onSubmit = async (data: ConfigFormData) => {
    if (!cuenta) return;

    const updatePayload: CuentaBancariaUpdate = {
      rpa_habilitado: data.rpa_habilitado,
      auto_match_habilitado: data.auto_match_habilitado,
      rpa_frecuencia: data.rpa_frecuencia,
      rpa_hora_ejecucion: data.rpa_hora_ejecucion,
      rpa_intervalo_minutos: data.rpa_intervalo_minutos,
      auto_match_frecuencia: data.auto_match_frecuencia,
      // el backend llama a este campo auto_match_hora (antes se perdía)
      auto_match_hora: data.auto_match_hora_ejecucion,
      auto_match_intervalo_minutos: data.auto_match_intervalo_minutos,
      auto_match_enviar_correo: data.auto_match_enviar_correo,
      activo: data.activo,
    };

    try {
      await updateMutation.mutateAsync({
        idCuenta: cuenta.id_cuenta,
        payload: updatePayload,
      });
      toast({
        title: "Configuración guardada",
        description: `Cuenta ${cuenta.alias || cuenta.banco_nombre} actualizada correctamente`,
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error al guardar",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  if (!cuenta) return null;

  const bancoNombre = cuenta.banco_nombre || "Banco no identificado";
  const rpaHabilitado = form.watch("rpa_habilitado");
  const autoMatchHabilitado = form.watch("auto_match_habilitado");
  const autoMatchFrecuencia = form.watch("auto_match_frecuencia");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent size="lg">
        <DrawerHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold">
                Configuración Avanzada
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {bancoNombre} — {cuenta.alias || cuenta.numero_cuenta}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-4 space-y-6"
            id="config-form"
          >

            {/* CARD RPA */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Configuración RPA (Descarga Extractos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <FormField
                  control={form.control}
                  name="rpa_habilitado"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <FormLabel>RPA Habilitado</FormLabel>
                        <FormDescription>
                          Permite la descarga automática programada de extractos
                          bancarios
                        </FormDescription>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rpa_frecuencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia de Ejecución</FormLabel>
                      <div ref={rpaFrecuenciaRef} className="relative w-full">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRpaFrecuencia(!openRpaFrecuencia)
                          }
                          disabled={isSubmitting || !rpaHabilitado}
                          className="w-full h-10 flex items-center justify-between border border-input bg-background px-3 py-2 text-sm rounded-md ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="truncate">
                            {FRECUENCIA_OPTIONS.find(
                              (o) => o.value === field.value,
                            )?.label || "Seleccionar frecuencia"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
                              openRpaFrecuencia && "rotate-180",
                            )}
                          />
                        </button>
                        {openRpaFrecuencia && (
                          <div className="absolute top-full left-0 mt-1 z-50 w-full max-h-[200px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                            {FRECUENCIA_OPTIONS.map((opt) => {
                              const isSelected = field.value === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(opt.value);
                                    setOpenRpaFrecuencia(false);
                                  }}
                                  disabled={isSubmitting || !rpaHabilitado}
                                  className={cn(
                                    "w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                    isSelected && "bg-accent/80 font-medium",
                                  )}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="rpa_hora_ejecucion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Ejecución</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={isSubmitting || !rpaHabilitado}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Formato 24h (ej. 02:00)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rpa_intervalo_minutos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={15}
                            max={1440}
                            step={15}
                            {...field}
                            disabled={isSubmitting || !rpaHabilitado}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Mín 15, Máx 1440 (24h)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator className="my-2" />

            {/* CARD AUTO-MATCH */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Configuración Auto-Match (Conciliación)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <FormField
                  control={form.control}
                  name="auto_match_habilitado"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <FormLabel>Auto-Match Habilitado</FormLabel>
                        <FormDescription>
                          Concilia automáticamente según el horario de abajo y
                          tras cada carga de extracto
                        </FormDescription>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_match_frecuencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia de Auto-Match</FormLabel>
                      <div
                        ref={autoMatchFrecuenciaRef}
                        className="relative w-full"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenAutoMatchFrecuencia(!openAutoMatchFrecuencia)
                          }
                          disabled={isSubmitting || !autoMatchHabilitado}
                          className="w-full h-10 flex items-center justify-between border border-input bg-background px-3 py-2 text-sm rounded-md ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="truncate">
                            {FRECUENCIA_OPTIONS.find(
                              (o) => o.value === field.value,
                            )?.label || "Seleccionar frecuencia"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
                              openAutoMatchFrecuencia && "rotate-180",
                            )}
                          />
                        </button>
                        {openAutoMatchFrecuencia && (
                          <div className="absolute top-full left-0 mt-1 z-50 w-full max-h-[200px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                            {FRECUENCIA_OPTIONS.map((opt) => {
                              const isSelected = field.value === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(opt.value);
                                    setOpenAutoMatchFrecuencia(false);
                                  }}
                                  disabled={
                                    isSubmitting || !autoMatchHabilitado
                                  }
                                  className={cn(
                                    "w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                    isSelected && "bg-accent/80 font-medium",
                                  )}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="auto_match_hora_ejecucion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora (Ecuador)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={isSubmitting || !autoMatchHabilitado}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>Formato 24 h</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="auto_match_intervalo_minutos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repetir cada (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={15}
                            max={1440}
                            step={15}
                            {...field}
                            disabled={isSubmitting || !autoMatchHabilitado || autoMatchFrecuencia !== "DIARIA"}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Solo diaria. 1440 = una vez al día
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="auto_match_enviar_correo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <FormLabel>Enviar informe por correo</FormLabel>
                        <FormDescription>
                          Tras el Auto-Match programado, envía el informe Excel a los usuarios activos con rol
                          Contabilidad o Receptor de correo, solo si hubo cruces nuevos (o un aviso si falló).
                        </FormDescription>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || !autoMatchHabilitado}
                      />
                    </FormItem>
                  )}
                />

                {autoMatchHabilitado && (
                  <div className="space-y-1 rounded-md border bg-muted/60 p-3 text-xs text-foreground">
                    <p>
                      <span className="font-medium">Programación:</span>{" "}
                      {describirFrecuencia({
                        auto_match_frecuencia: autoMatchFrecuencia,
                        auto_match_hora: form.watch("auto_match_hora_ejecucion"),
                        auto_match_intervalo_minutos: Number(form.watch("auto_match_intervalo_minutos")),
                      })}{" "}
                      y tras cada carga de extracto. Concilia el mes en curso (y el anterior durante los
                      primeros 10 días, si su acta no está cerrada).
                    </p>
                    {cuenta.auto_match_ultimo_resultado && (
                      <p className="break-words text-muted-foreground">
                        <span className="font-medium">Última ejecución:</span>{" "}
                        {cuenta.auto_match_ultimo_resultado}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator className="my-2" />

            {/* CARD ESTADO GENERAL */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <FormLabel>Cuenta Activa</FormLabel>
                        <FormDescription>
                          Las cuentas inactivas no aparecen en Workbench ni
                          Cargas ETL
                        </FormDescription>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>

        <DrawerFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="config-form"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
