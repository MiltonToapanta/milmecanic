export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface AppointmentCustomerSummary {
  id: string;
  displayName: string;
  identification: string;
}

export interface AppointmentVehicleSummary {
  id: string;
  plate: string;
  displayName: string;
}

export interface AppointmentUserSummary {
  id: string;
  displayName: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  assignedUserId?: string | null;
  scheduledAt: string;
  estimatedDurationMinutes: number;
  reason: string;
  notes?: string | null;
  status: AppointmentStatus;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: AppointmentCustomerSummary;
  vehicle: AppointmentVehicleSummary;
  assignedUser: AppointmentUserSummary | null;
}

export interface AppointmentQuery {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  vehicleId?: string;
  assignedUserId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface AppointmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AppointmentListResponse {
  items: Appointment[];
  pagination: AppointmentPagination;
}

export interface AppointmentPayload {
  customerId: string;
  vehicleId: string;
  assignedUserId?: string;
  scheduledAt: string;
  estimatedDurationMinutes: number;
  reason: string;
  notes?: string;
}

export interface AppointmentFormValues {
  customerId: string;
  vehicleId: string;
  assignedUserId: string;
  date: string;
  time: string;
  estimatedDurationMinutes: number;
  reason: string;
  notes: string;
}

export interface ChangeAppointmentStatusPayload {
  status: AppointmentStatus;
  cancellationReason?: string;
}
