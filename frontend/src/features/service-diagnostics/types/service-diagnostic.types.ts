import type { ServiceOrderStatus } from '../../service-orders/types/service-order.types';

export type DiagnosticItemStatus = 'GOOD' | 'REGULAR' | 'BAD' | 'NOT_CHECKED';
export type DiagnosticSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DiagnosticCategory =
  | 'ENGINE'
  | 'BRAKES'
  | 'SUSPENSION'
  | 'STEERING'
  | 'TRANSMISSION'
  | 'ELECTRICAL'
  | 'BATTERY'
  | 'TIRES'
  | 'COOLING'
  | 'EXHAUST'
  | 'BODY'
  | 'LIGHTS'
  | 'FLUIDS'
  | 'OTHER';

export interface DiagnosticServiceOrderSummary {
  id: string;
  orderNumber: string;
  status: ServiceOrderStatus;
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

export interface ServiceDiagnosticItem {
  id: string;
  diagnosticId: string;
  category: DiagnosticCategory;
  itemName: string;
  status: DiagnosticItemStatus;
  observation?: string | null;
  severity?: DiagnosticSeverity | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ServiceDiagnostic {
  id: string;
  serviceOrderId: string;
  generalObservation?: string | null;
  recommendation?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  serviceOrder: DiagnosticServiceOrderSummary;
  items: ServiceDiagnosticItem[];
}

export interface DiagnosticItemPayload {
  category: DiagnosticCategory;
  itemName: string;
  status: DiagnosticItemStatus;
  observation?: string;
  severity?: DiagnosticSeverity;
}

export interface ServiceDiagnosticPayload {
  serviceOrderId: string;
  generalObservation?: string;
  recommendation?: string;
  items: DiagnosticItemPayload[];
}

export interface UpdateServiceDiagnosticPayload {
  generalObservation?: string;
  recommendation?: string;
}

export interface DiagnosticSummaryValues {
  total: number;
  good: number;
  regular: number;
  bad: number;
  notChecked: number;
  critical: number;
}

export interface EditableDiagnosticItem extends DiagnosticItemPayload {
  id?: string;
  localId: string;
}
