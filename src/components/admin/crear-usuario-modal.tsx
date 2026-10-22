"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Save, AlertCircle, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCreateUsuario, useUpdateUsuario } from "@/lib/hooks/use-usuarios";
import { identidadApi } from "@/lib/api/identidad";
import { CORPORATE_DOMAIN } from "@/lib/api/auth";
import { ROLES, ROL_INFO, type SugerenciaUsuario, type Usuario } from "@/types/identity";

const usuarioSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .refine((val) => val.toLowerCase().endsWith(`@${CORPORATE_DOMAIN}`), {
      message: `Solo se permiten correos corporativos @${CORPORATE_DOMAIN}`,
    }),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  rol: z.enum(ROLES, {
    errorMap: () => ({ message: "Seleccione un rol válido" }),
  }),
  activo: z.boolean(),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const VACIO: UsuarioFormData = { email: "", nombre: "", rol: "BASICO", activo: true };

const ORIGEN_SUGERENCIA: Record<string, string> = {
  google: "Nombre tomado de Google Workspace",
  correo: "Sugerido a partir del correo; revíselo",
};

interface UsuarioFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se indica, el formulario edita ese usuario; si no, crea uno nuevo */
  usuario?: Usuario | null;
}

/** Alta y edición de usuarios de la Allowlist (mismo formulario). */
export function CrearUsuarioModal({ open, onOpenChange, usuario }: UsuarioFormDrawerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const editando = !!usuario;
  const esYo = editando && usuario?.email === user?.email;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: VACIO,
    mode: "onBlur",
  });

  // Al abrir: datos del usuario a editar o formulario vacío
  useEffect(() => {
    if (!open) return;
    form.reset(
      usuario
        ? { email: usuario.email, nombre: usuario.nombre || "", rol: usuario.rol, activo: usuario.activo }
        : VACIO,
    );
    setSugerencia(null);
    nombreEditado.current = editando;
  }, [open, usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Sugerencia de nombre al escribir el correo (solo al crear) ---------------
  const [sugerencia, setSugerencia] = useState<SugerenciaUsuario | null>(null);
  const [buscando, setBuscando] = useState(false);
  const nombreEditado = useRef(false);
  const email = form.watch("email");

  useEffect(() => {
    if (editando) return;
    const valor = (email || "").trim().toLowerCase();
    if (!valor.endsWith(`@${CORPORATE_DOMAIN}`) || valor.length <= CORPORATE_DOMAIN.length + 1) {
      setSugerencia(null);
      return;
    }
    let cancelado = false;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const s = await identidadApi.getSugerencia(valor);
        if (cancelado) return;
        setSugerencia(s);
        if (s.nombre && !s.ya_registrado && !nombreEditado.current) {
          form.setValue("nombre", s.nombre, { shouldValidate: true });
        }
      } catch {
        if (!cancelado) setSugerencia(null);
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 450);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [email, editando, form]);

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      if (usuario) {
        // Solo se envían los campos que cambiaron
        const cambios: Partial<UsuarioFormData> = {};
        (Object.keys(data) as (keyof UsuarioFormData)[]).forEach((k) => {
          const anterior = k === "nombre" ? usuario.nombre || "" : usuario[k];
          if (data[k] !== anterior) (cambios as Record<string, unknown>)[k] = data[k];
        });
        if (Object.keys(cambios).length === 0) {
          onOpenChange(false);
          return;
        }
        await updateMutation.mutateAsync({ idUsuario: usuario.id_usuario, payload: cambios });
        toast({ title: "Usuario actualizado", description: `${data.nombre} (${data.email})`, variant: "success" });
      } else {
        await createMutation.mutateAsync({ email: data.email, nombre: data.nombre, rol: data.rol });
        toast({ title: "Usuario creado", description: "El usuario fue agregado a la Allowlist.", variant: "success" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: editando ? "Error al actualizar el usuario" : "Error al crear el usuario",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const yaRegistrado = !editando && sugerencia?.ya_registrado;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <DrawerHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold">
                {editando ? "Editar usuario" : "Nuevo usuario"}
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {editando ? usuario?.email : "Agregar usuario a la Allowlist corporativa"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Cerrar">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-4 space-y-6"
            id="usuario-form"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo corporativo *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder={`usuario@${CORPORATE_DOMAIN}`}
                        {...field}
                        disabled={isSubmitting || esYo}
                        autoComplete="off"
                      />
                      {buscando && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {esYo
                      ? "No puede cambiar su propio correo (es su usuario de inicio de sesión)."
                      : `Solo cuentas @${CORPORATE_DOMAIN}. Es la cuenta con la que inicia sesión con Google.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {yaRegistrado && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Este correo ya está registrado{sugerencia?.nombre ? ` como ${sugerencia.nombre}` : ""}. Edítelo desde la lista de usuarios.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan Pérez"
                      {...field}
                      onChange={(e) => {
                        nombreEditado.current = true;
                        field.onChange(e);
                      }}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                  </FormControl>
                  {!editando && sugerencia?.nombre && !yaRegistrado && sugerencia.origen && ORIGEN_SUGERENCIA[sugerencia.origen] ? (
                    <FormDescription className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-brand-yellow" />
                      {ORIGEN_SUGERENCIA[sugerencia.origen]}
                      {field.value !== sugerencia.nombre && (
                        <button
                          type="button"
                          className="ml-1 font-medium text-primary hover:underline"
                          onClick={() => form.setValue("nombre", sugerencia.nombre || "", { shouldValidate: true })}
                        >
                          Usar «{sugerencia.nombre}»
                        </button>
                      )}
                    </FormDescription>
                  ) : (
                    <FormDescription>Nombre con el que aparece en la app y en los correos.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || esYo}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((value) => (
                        <SelectItem key={value} value={value} description={ROL_INFO[value].descripcion}>
                          {ROL_INFO[value].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {esYo && <FormDescription>No puede cambiar su propio rol.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {editando && (
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <FormLabel>Usuario activo</FormLabel>
                      <FormDescription>Los usuarios inactivos no pueden iniciar sesión ni recibir correos.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting || esYo} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>

        <DrawerFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="usuario-form" disabled={isSubmitting || !!yaRegistrado} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editando ? "Guardar cambios" : "Crear usuario"}
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
