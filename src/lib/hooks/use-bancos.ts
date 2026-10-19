import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { bancosApi } from "@/lib/api/bancos";
import {
  CuentaBancaria,
  CuentaBancariaCreate,
  CuentaBancariaUpdate,
  SincronizarCatalogoResponse,
  CargaExtracto,
  CargaExtractoUpload,
  MovimientoBancoPendiente,
  FiltrosCargas,
  PaginatedResponse,
} from "@/types/bancos";

export const bancosKeys = {
  all: ["bancos"] as const,
  cuentas: () => [...bancosKeys.all, "cuentas"] as const,
  cargas: (filtros?: FiltrosCargas) =>
    [...bancosKeys.all, "cargas", filtros] as const,
  movimientosPendientes: (idCuenta: string) =>
    [...bancosKeys.all, "movimientos", "pendientes", idCuenta] as const,
};

export function useCuentasBancarias(
  options?: UseQueryOptions<CuentaBancaria[], Error>,
) {
  return useQuery({
    queryKey: bancosKeys.cuentas(),
    queryFn: bancosApi.getCuentas,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreateCuentaBancaria(
  options?: UseMutationOptions<CuentaBancaria, Error, CuentaBancariaCreate>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bancosApi.createCuenta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
    },
    ...options,
  });
}

export function useUpdateCuentaBancaria(
  options?: UseMutationOptions<
    CuentaBancaria,
    Error,
    { idCuenta: string; payload: CuentaBancariaUpdate }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idCuenta, payload }) =>
      bancosApi.updateCuenta(idCuenta, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
    },
    ...options,
  });
}

export function useSincronizarCatalogo(
  options?: UseMutationOptions<SincronizarCatalogoResponse, Error, void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bancosApi.sincronizarCatalogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
    },
    ...options,
  });
}

export function useCargasExtractos(
  filtros: FiltrosCargas = {},
  options?: UseQueryOptions<PaginatedResponse<CargaExtracto>, Error>,
) {
  return useQuery({
    queryKey: bancosKeys.cargas(filtros),
    queryFn: () => bancosApi.getCargas(filtros),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useUploadExtracto(
  options?: UseMutationOptions<CargaExtracto, Error, CargaExtractoUpload>,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    mutationFn: (payload: CargaExtractoUpload) => {
      const emailResponsable =
        payload.created_by || payload.creado_por || "operador@fabribat.com";

      const cleanPayload: CargaExtractoUpload = {
        ...payload,
        created_by: emailResponsable,
        creado_por: emailResponsable,
      };

      return bancosApi.uploadExtracto(cleanPayload);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cargas() });
      queryClient.invalidateQueries({ queryKey: ["bancos", "movimientos"] });
      if (onSuccess) {
        (onSuccess as Function)(data, variables, context);
      }
    },
    ...restOptions,
  });
}

export function useMovimientosPendientes(
  idCuenta: string,
  enabled = true,
  options?: UseQueryOptions<MovimientoBancoPendiente[], Error>,
) {
  return useQuery({
    queryKey: bancosKeys.movimientosPendientes(idCuenta),
    queryFn: () => bancosApi.getMovimientosPendientes(idCuenta),
    enabled: enabled && !!idCuenta,
    staleTime: 30 * 1000,
    ...options,
  });
}
