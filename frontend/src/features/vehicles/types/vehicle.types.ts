export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GAS' | 'OTHER';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'OTHER';

export interface VehicleCustomerSummary {
  id: string;
  displayName: string;
  identification: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plate: string;
  vin?: string | null;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  mileage: number;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: VehicleCustomerSummary;
}

export interface VehicleQuery {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  brand?: string;
  fuelType?: FuelType;
  transmissionType?: TransmissionType;
  isActive?: boolean;
}

export interface VehiclePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VehicleListResponse {
  items: Vehicle[];
  pagination: VehiclePagination;
}

export interface VehiclePayload {
  customerId: string;
  plate: string;
  vin?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  engineNumber?: string;
  chassisNumber?: string;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  mileage: number;
  notes?: string;
}

export interface VehicleFormValues extends VehiclePayload {
  isActive: boolean;
}
