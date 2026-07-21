import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vehiclesApi from '../api/vehicles.api';
import type { VehiclePayload, VehicleQuery } from '../types/vehicle.types';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (query: VehicleQuery) => [...vehicleKeys.all, 'list', query] as const,
  byCustomer: (customerId: string, query: VehicleQuery) => [...vehicleKeys.all, 'customer', customerId, query] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const
};

export function useVehicles(query: VehicleQuery) {
  return useQuery({ queryKey: vehicleKeys.list(query), queryFn: () => vehiclesApi.getVehicles(query) });
}

export function useVehiclesByCustomer(customerId: string, query: VehicleQuery) {
  return useQuery({
    queryKey: vehicleKeys.byCustomer(customerId, query),
    queryFn: () => vehiclesApi.getVehiclesByCustomer(customerId, query),
    enabled: Boolean(customerId)
  });
}

export function useVehicle(id: string) {
  return useQuery({ queryKey: vehicleKeys.detail(id), queryFn: () => vehiclesApi.getVehicle(id), enabled: Boolean(id) });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createVehicle,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VehiclePayload }) => vehiclesApi.updateVehicle(id, payload),
    onSuccess: async (_vehicle, variables) => {
      await queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      await queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) });
    }
  });
}

export function useActivateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: vehiclesApi.activateVehicle, onSuccess: async () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }) });
}

export function useDeactivateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: vehiclesApi.deactivateVehicle, onSuccess: async () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }) });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: vehiclesApi.deleteVehicle, onSuccess: async () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }) });
}
