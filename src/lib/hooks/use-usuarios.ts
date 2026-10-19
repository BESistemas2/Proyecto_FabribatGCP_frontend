import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { identidadApi } from "@/lib/api/identidad";
import {
  Destinatario,
  Usuario,
  UsuarioCreate,
  UsuarioUpdateEstado,
  UsuarioUpdateRol,
} from "@/types/identity";

export const usuariosKeys = {
  all: ["usuarios"] as const,
  list: () => [...usuariosKeys.all, "list"] as const,
  destinatarios: () => [...usuariosKeys.all, "destinatarios"] as const,
};

/** Usuarios activos que pueden recibir reportes (no requiere rol ADMIN). */
export function useDestinatarios() {
  return useQuery<Destinatario[], Error>({
    queryKey: usuariosKeys.destinatarios(),
    queryFn: identidadApi.getDestinatarios,
    staleTime: 5 * 60 * 1000,
  });
}

/** Lista completa de usuarios (solo ADMIN). */
export function useUsuarios({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<Usuario[], Error>({
    queryKey: usuariosKeys.list(),
    queryFn: identidadApi.getUsuarios,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCreateUsuario(
  options?: UseMutationOptions<Usuario, Error, UsuarioCreate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: identidadApi.createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
    ...options,
  });
}

export function useUpdateUsuarioEstado(
  options?: UseMutationOptions<
    Usuario,
    Error,
    { idUsuario: string; payload: { activo: boolean } }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, payload }) =>
      identidadApi.updateEstado(idUsuario, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
    ...options,
  });
}

export function useUpdateUsuarioRol(
  options?: UseMutationOptions<
    Usuario,
    Error,
    { idUsuario: string; payload: UsuarioUpdateRol }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, payload }) =>
      identidadApi.updateRol(idUsuario, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
    ...options,
  });
}