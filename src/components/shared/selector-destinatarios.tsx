"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useUsuarios } from "@/lib/hooks/use-usuarios";

interface SelectorDestinatariosProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

// Colores visuales para diferenciar roles rápidamente
const ROL_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 border-red-200",
  CONTABILIDAD: "bg-blue-100 text-blue-800 border-blue-200",
  BASICO: "bg-gray-100 text-gray-800 border-gray-200",
  RECEPTOR_MAIL: "bg-green-100 text-green-800 border-green-200",
};

export function SelectorDestinatarios({
  value = [],
  onChange,
  disabled = false,
}: SelectorDestinatariosProps) {
  const [open, setOpen] = React.useState(false);

  // Consumimos el hook real que ya tenías
  const { data: usuarios = [], isLoading } = useUsuarios();

  // Filtrar solo usuarios activos
  const usuariosActivos = usuarios.filter((u) => u.activo);

  // Mapear los IDs seleccionados a objetos de usuario completos
  const selectedUsers = usuariosActivos.filter((u) =>
    value.includes(u.id_usuario),
  );

  const toggleUsuario = (idUsuario: string) => {
    if (value.includes(idUsuario)) {
      onChange(value.filter((id) => id !== idUsuario));
    } else {
      onChange([...value, idUsuario]);
    }
  };

  const removeUsuario = (idUsuario: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== idUsuario));
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={!disabled && open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-auto min-h-[2.5rem] py-2 px-3"
          >
            <div className="flex flex-wrap gap-1 items-center text-left">
              {selectedUsers.length > 0 ? (
                selectedUsers.map((user) => (
                  <Badge
                    key={user.id_usuario}
                    variant="secondary"
                    className={cn(
                      "mr-1 mb-1 flex items-center gap-1 font-normal",
                      ROL_COLORS[user.rol] || "bg-gray-100",
                    )}
                  >
                    <span className="text-[10px] font-bold opacity-70">
                      [{user.rol}]
                    </span>
                    {user.email}
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "ml-1 ring-offset-background rounded-full outline-none hover:bg-black/20 focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        disabled && "pointer-events-none opacity-50",
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          removeUsuario(user.id_usuario, e as any);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) =>
                        !disabled && removeUsuario(user.id_usuario, e)
                      }
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </div>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground font-normal">
                  Seleccionar destinatarios...
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full md:w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nombre o correo..." />
            <CommandList>
              {isLoading ? (
                <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando usuarios...
                </div>
              ) : (
                <CommandEmpty>No se encontraron usuarios activos.</CommandEmpty>
              )}
              {!isLoading && (
                <CommandGroup>
                  {usuariosActivos.map((user) => (
                    <CommandItem
                      key={user.id_usuario}
                      value={`${user.nombre} ${user.email}`}
                      onSelect={() => toggleUsuario(user.id_usuario)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(user.id_usuario)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{user.nombre}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span
                            className={cn(
                              "px-1 rounded-sm text-[9px] font-bold uppercase",
                              ROL_COLORS[user.rol] || "bg-gray-200",
                            )}
                          >
                            {user.rol}
                          </span>
                          {user.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
