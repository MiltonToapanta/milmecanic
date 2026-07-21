import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as appointmentsApi from '../api/appointments.api';
import type { AppointmentPayload, AppointmentQuery, ChangeAppointmentStatusPayload } from '../types/appointment.types';

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (query: AppointmentQuery) => [...appointmentKeys.all, 'list', query] as const,
  byCustomer: (customerId: string, query: AppointmentQuery) => [...appointmentKeys.all, 'customer', customerId, query] as const,
  byVehicle: (vehicleId: string, query: AppointmentQuery) => [...appointmentKeys.all, 'vehicle', vehicleId, query] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const
};

export function useAppointments(query: AppointmentQuery) {
  return useQuery({ queryKey: appointmentKeys.list(query), queryFn: () => appointmentsApi.getAppointments(query) });
}

export function useAppointmentsByCustomer(customerId: string, query: AppointmentQuery) {
  return useQuery({
    queryKey: appointmentKeys.byCustomer(customerId, query),
    queryFn: () => appointmentsApi.getAppointmentsByCustomer(customerId, query),
    enabled: Boolean(customerId)
  });
}

export function useAppointmentsByVehicle(vehicleId: string, query: AppointmentQuery) {
  return useQuery({
    queryKey: appointmentKeys.byVehicle(vehicleId, query),
    queryFn: () => appointmentsApi.getAppointmentsByVehicle(vehicleId, query),
    enabled: Boolean(vehicleId)
  });
}

export function useAppointment(id: string) {
  return useQuery({ queryKey: appointmentKeys.detail(id), queryFn: () => appointmentsApi.getAppointment(id), enabled: Boolean(id) });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.createAppointment,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentPayload }) => appointmentsApi.updateAppointment(id, payload),
    onSuccess: async (_appointment, variables) => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
    }
  });
}

export function useChangeAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeAppointmentStatusPayload }) => appointmentsApi.changeAppointmentStatus(id, payload),
    onSuccess: async (_appointment, variables) => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
    }
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: appointmentsApi.deleteAppointment, onSuccess: async () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all }) });
}
