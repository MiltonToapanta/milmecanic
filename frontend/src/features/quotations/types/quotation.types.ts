export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type QuotationItemType = 'LABOR' | 'PART' | 'SUPPLY' | 'OTHER';

export interface QuotationServiceOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    id: string;
    displayName: string;
    identification: string;
  };
  vehicle: {
    id: string;
    plate: string;
    displayName: string;
  };
}

export interface QuotationItem {
  id: string;
  itemType: QuotationItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  serviceOrderId: string;
  status: QuotationStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  serviceOrder: QuotationServiceOrderSummary;
  items: QuotationItem[];
}

export interface QuotationListResponse {
  items: Quotation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuotationQuery {
  page: number;
  limit: number;
  search?: string;
  serviceOrderId?: string;
  status?: QuotationStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateQuotationItemInput {
  itemType: QuotationItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface CreateQuotationPayload {
  serviceOrderId: string;
  validUntil?: string;
  notes?: string;
  discount?: number;
  items: CreateQuotationItemInput[];
}

export interface UpdateQuotationPayload {
  validUntil?: string | null;
  notes?: string;
  discount?: number;
  items?: CreateQuotationItemInput[];
}
