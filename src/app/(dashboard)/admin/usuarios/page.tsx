"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useUsuarios,
  useUpdateUsuarioEstado,
  useUpdateUsuarioRol,
} from "@/lib/hooks/use-usuarios";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Search,
  Shield,
  UserCog,
  MoreHorizontal,
  AlertCircle,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { CrearUsuarioModal } from "@/components/admin/crear-usuario-modal";
import { ROLES, ROL_INFO, getRolInfo, type RolUsuario, type Usuario } from "@/types/identity";

function UsuarioRow({
  usuario,
  onToggleActivo,
  onCambiarRol,
}: {
  usuario: Usuario;
  onToggleActivo: (id: string, checked: boolean) => void;
  onCambiarRol: (id: string, rol: RolUsuario) => void;
}) {
  const rolInfo = getRolInfo(usuario.rol);
  return (
    <TableRow className={!usuario.activo ? "opacity-50" : "hover:bg-muted/50"}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium truncate max-w-[180px]">
            {usuario.nombre}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground max-w-[280px] truncate">
        {usuario.email}
      </TableCell>
      <TableCell>
        <Badge
          variant={rolInfo.badge}
          className={cn("gap-1 px-2 py-1 text-xs", rolInfo.color)}
        >
          {rolInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Switch
          checked={usuario.activo}
          onCheckedChange={(checked) =>
            onToggleActivo(usuario.id_usuario, checked)
          }
          aria-label={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
        />
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(usuario.created_at)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                  {usuario.nombre}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate max-w-[200px]">
                  {usuario.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLES.map((rol) => (
              <DropdownMenuItem
                key={rol}
                onClick={() => onCambiarRol(usuario.id_usuario, rol)}
                disabled={usuario.rol === rol}
              >
                {rol === "ADMIN" ? (
                  <Shield className="h-4 w-4 mr-2" />
                ) : (
                  <UserCog className="h-4 w-4 mr-2" />
                )}
                Asignar rol: {ROL_INFO[rol].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                onToggleActivo(usuario.id_usuario, !usuario.activo)
              }
              className={!usuario.activo ? "text-green-600" : "text-red-600"}
            >
              {usuario.activo ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function UsuariosAdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const esAdmin = user?.rol === "ADMIN";

  const { data: usuarios, isLoading } = useUsuarios({ enabled: esAdmin });
  const updateEstadoMutation = useUpdateUsuarioEstado();
  const updateRolMutation = useUpdateUsuarioRol();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCrearModal, setShowCrearModal] = useState(false);

  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    if (!searchTerm) return usuarios;

    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term),
    );
  }, [usuarios, searchTerm]);

  const handleToggleActivo = async (
    idUsuario: string,
    nuevoEstado: boolean,
  ) => {
    try {
      await updateEstadoMutation.mutateAsync({
        idUsuario,
        payload: { activo: nuevoEstado },
      });
      toast({
        title: nuevoEstado ? "Usuario activado" : "Usuario desactivado",
        description: "El estado del usuario ha sido actualizado.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error al actualizar estado",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handleCambiarRol = async (
    idUsuario: string,
    nuevoRol: RolUsuario,
  ) => {
    try {
      await updateRolMutation.mutateAsync({
        idUsuario,
        payload: { rol: nuevoRol },
      });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error al actualizar rol",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">
          Acceso requerido
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Debes iniciar sesión para acceder al panel de administración.
        </p>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">
          Acceso Denegado
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          No tienes permisos para acceder a esta sección. Se requiere rol de
          Administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administración de accesos y roles de la Allowlist corporativa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCrearModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Usuario
          </Button>
        </div>
      </div>

      {/* Indicadores clave (KPIs) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Total Usuarios
              <Badge variant="secondary" className="ml-2">
                {usuarios?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {usuarios?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-500" />
              Activos
              <Badge variant="secondary" className="ml-2">
                {usuarios?.filter((c) => c.activo).length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-green-600">
              {usuarios?.filter((c) => c.activo).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-500" />
              Administradores
              <Badge variant="secondary" className="ml-2">
                {usuarios?.filter((c) => c.rol === "ADMIN").length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-purple-600">
              {usuarios?.filter((c) => c.rol === "ADMIN").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Usuarios de la Allowlist
              <Badge variant="secondary" className="ml-2">
                {filteredUsuarios.length}
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "Sin resultados" : "No hay usuarios registrados"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchTerm
                  ? "Intente ajustar los términos de búsqueda"
                  : "Agregue el primer usuario usando el botón 'Agregar Usuario'"}
              </p>
              <Button
                onClick={() => setShowCrearModal(true)}
                className="w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Usuario
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-[60px]">Usuario</TableHead>
                    <TableHead>Correo Corporativo</TableHead>
                    <TableHead className="w-[140px]">Rol</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead className="w-[120px]">Creado</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => (
                    <UsuarioRow
                      key={usuario.id_usuario}
                      usuario={usuario}
                      onToggleActivo={handleToggleActivo}
                      onCambiarRol={handleCambiarRol}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CrearUsuarioModal
        open={showCrearModal}
        onOpenChange={setShowCrearModal}
      />
    </div>
  );
}
