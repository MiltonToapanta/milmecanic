import type { AppointmentStatus } from '../../appointments/types/appointment.types';

export type ServiceOrderStatus =
  | 'RECEIVED'
  | 'DIAGNOSIS'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_REPAIR'
  | 'QUALITY_CONTROL'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type FuelLevel = 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTERS' | 'FULL';

export interface ServiceOrderCustomerSummary {
  id: string;
  displayName: string;
  identification: string;
}

export interface ServiceOrderVehicleSummary {
  id: string;
  plate: string;
  displayName: string;
}

export interface ServiceOrderUserSummary {
  id: string;
  displayName: string;
}

export interface ServiceOrderAppointmentSummary {
  id: string;
  scheduledAt: string;
  reason: string;
  status: AppointmentStatus;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  vehicleId: string;
  appointmentId?: string | null;
  assignedAdvisorId?: string | null;
  assignedMechanicId?: string | null;
  status: ServiceOrderStatus;
  reportedMileage: number;
  fuelLevel: FuelLevel;
  customerRequest: string;
  initialDiagnosis?: string | null;
  internalNotes?: string | null;
  estimatedDeliveryAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  deliveredAt?: string | null;
  cancellationReason?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: ServiceOrderCustomerSummary;
  vehicle: ServiceOrderVehicleSummary;
  appointment: ServiceOrderAppointmentSummary | null;
  assignedAdvisor: ServiceOrderUserSummary | null;
  assignedMechanic: ServiceOrderUserSummary | null;
}

export interface ServiceOrderQuery {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  vehicleId?: string;
  appointmentId?: string;
  assignedAdvisorId?: string;
  assignedMechanicId?: string;
  status?: ServiceOrderStatus;
  dateFrom?: string;
  dateTo?: string;
  isActive?: boolean;
}

export interface ServiceOrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServiceOrderListResponse {
  items: ServiceOrder[];
  pagination: ServiceOrderPagination;
}

export interface ServiceOrderPayload {
  customerId: string;
  vehicleId: string;
  appointmentId?: string;
  assignedAdvisorId?: string;
  assignedMechanicId?: string;
  reportedMileage: number;
  fuelLevel: FuelLevel;
  customerRequest: string;
  initialDiagnosis?: string;
  internalNotes?: string;
  estimatedDeliveryAt?: string;
}

export interface ServiceOrderFormValues {
  customerId: string;
  vehicleId: string;
  appointmentId: string;
  assignedAdvisorId: string;
  assignedMechanicId: string;
  reportedMileage: number;
  fuelLevel: FuelLevel | '';
  customerRequest: string;
  initialDiagnosis: string;
  internalNotes: string;
  estimatedDeliveryDate: string;
  estimatedDeliveryTime: string;
}

export interface ChangeServiceOrderStatusPayload {
  status: ServiceOrderStatus;
  cancellationReason?: string;
}
