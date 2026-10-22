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
  CargaUploadResponse,
  MovimientoBancoPendiente,
  FiltrosCargas,
  PaginatedResponse,
} from "@/types/bancos";

export const bancosKeys = {
  all: ["bancos"] as const,
  cuentas: () => [...bancosKeys.all, "cuentas"] as const,
  cargasAll: () => [...bancosKeys.all, "cargas"] as const,
  cargas: (filtros?: FiltrosCargas) => [...bancosKeys.all, "cargas", filtros ?? {}] as const,
  movimientosAll: () => [...bancosKeys.all, "movimientos"] as const,
  movimientosPendientes: (idCuenta: string, fechaInicio = "", fechaFin = "") =>
    [...bancosKeys.all, "movimientos", "pendientes", idCuenta, fechaInicio, fechaFin] as const,
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
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
      (options?.onSuccess as any)?.(...args);
    },
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
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
      (options?.onSuccess as any)?.(...args);
    },
  });
}

export function useSincronizarCatalogo(
  options?: UseMutationOptions<SincronizarCatalogoResponse, Error, void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bancosApi.sincronizarCatalogo,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
      (options?.onSuccess as any)?.(...args);
    },
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

export function useUploadExtracto() {
  const queryClient = useQueryClient();
  return useMutation<CargaUploadResponse, Error, CargaExtractoUpload>({
    mutationFn: (payload) => bancosApi.uploadExtracto(payload),
    onSuccess: (r) => {
      // Claves raíz: refresca TODAS las páginas/filtros del historial y los pendientes
      const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: bancosKeys.cargasAll() });
        queryClient.invalidateQueries({ queryKey: bancosKeys.movimientosAll() });
        queryClient.invalidateQueries({ queryKey: bancosKeys.cuentas() });
        queryClient.invalidateQueries({ queryKey: ["conciliacion"] });
      };
      refrescar();
      // El Auto-Match corre en segundo plano en el servidor: se vuelve a consultar cuando termina
      if (r.auto_match_en_curso) {
        setTimeout(refrescar, 15000);
        setTimeout(refrescar, 45000);
      }
    },
  });
}

export function useMovimientosPendientes(idCuenta: string, fechaInicio = "", fechaFin = "", enabled = true) {
  return useQuery<MovimientoBancoPendiente[], Error>({
    queryKey: bancosKeys.movimientosPendientes(idCuenta, fechaInicio, fechaFin),
    queryFn: () => bancosApi.getMovimientosPendientes(idCuenta, fechaInicio, fechaFin),
    enabled: enabled && !!idCuenta,
    staleTime: 30 * 1000,
  });
}
