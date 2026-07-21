export type CustomerType = 'PERSON' | 'COMPANY';
export type IdentificationType = 'CEDULA' | 'RUC' | 'PASSPORT' | 'OTHER';

export interface Customer {
  id: string;
  customerType: CustomerType;
  identificationType: IdentificationType;
  identification: string;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerQuery {
  page: number;
  limit: number;
  search?: string;
  customerType?: CustomerType;
  identificationType?: IdentificationType;
  isActive?: boolean;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerListResponse {
  items: Customer[];
  pagination: CustomerPagination;
}

export interface CustomerPayload {
  customerType: CustomerType;
  identificationType: IdentificationType;
  identification: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface CustomerFormValues extends CustomerPayload {
  isActive: boolean;
}
