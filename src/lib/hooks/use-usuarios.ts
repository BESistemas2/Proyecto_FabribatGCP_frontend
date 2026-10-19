import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { identidadApi } from "@/lib/api/identidad";
import {
  Usuario,
  UsuarioCreate,
  UsuarioUpdateEstado,
  UsuarioUpdateRol,
} from "@/types/identity";

export const usuariosKeys = {
  all: ["usuarios"] as const,
  list: () => [...usuariosKeys.all, "list"] as const,
};

export function useUsuarios(
  options?: UseQueryOptions<Usuario[], Error>
) {
  return useQuery({
    queryKey: usuariosKeys.list(),
    queryFn: identidadApi.getUsuarios,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreateUsuario(
  options?: UseMutationOptions<Usuario, Error, UsuarioCreate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: identidadApi.createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
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
      queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
    },
    ...options,
  });
}

export function useUpdateUsuarioRol(
  options?: UseMutationOptions<
    Usuario,
    Error,
    { idUsuario: string; payload: { rol: string } }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, payload }) =>
      identidadApi.updateRol(idUsuario, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
    },
    ...options,
  });
}