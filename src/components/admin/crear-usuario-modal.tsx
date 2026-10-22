"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Save, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/lib/hooks/use-toast";
import { useCreateUsuario } from "@/lib/hooks/use-usuarios";
import { ROLES, ROL_INFO } from "@/types/identity";

const crearUsuarioSchema = z.object({
  email: z
    .string()
    .email("Correo electrónico inválido")
    .refine((val) => val.toLowerCase().endsWith("@bateriasecuador.com"), {
      message: "Solo se permiten correos corporativos @bateriasecuador.com",
    }),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  rol: z.enum(ROLES, {
    errorMap: () => ({ message: "Seleccione un rol válido" }),
  }),
});

type CrearUsuarioFormData = z.infer<typeof crearUsuarioSchema>;

interface CrearUsuarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function CrearUsuarioModal({
  open,
  onOpenChange,
}: CrearUsuarioModalProps) {
  const { toast } = useToast();
  const createMutation = useCreateUsuario();
  const isSubmitting = createMutation.isPending;

  const form = useForm<CrearUsuarioFormData>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      email: "",
      nombre: "",
      rol: "BASICO",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: CrearUsuarioFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: "Usuario creado",
        description:
          "El usuario ha sido agregado a la Allowlist correctamente.",
        variant: "success",
      });
      form.reset({ email: "", nombre: "", rol: "BASICO" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error al crear usuario",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <DrawerHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold">
                Nuevo Usuario
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Agregar usuario a la Allowlist corporativa
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
            id="crear-usuario-form"
          >
            <Alert variant="default" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Solo se permiten correos del dominio corporativo{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                  @bateriasecuador.com
                </code>
                .
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@bateriasecuador.com"
                      {...field}
                      disabled={createMutation.isPending}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormDescription>
                    Correo corporativo del usuario (dominio
                    @bateriasecuador.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan Pérez"
                      {...field}
                      disabled={createMutation.isPending}
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre completo del usuario para identificación
                  </FormDescription>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={createMutation.isPending}
                  >
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DrawerFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="crear-usuario-form"
            disabled={createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Usuario
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
