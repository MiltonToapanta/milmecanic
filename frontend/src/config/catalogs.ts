import type { CustomerType, IdentificationType } from '../features/customers/types/customer.types';
import type { AppointmentStatus } from '../features/appointments/types/appointment.types';
import type { FuelType, TransmissionType } from '../features/vehicles/types/vehicle.types';

export interface CatalogOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export const customerTypeOptions: CatalogOption<CustomerType>[] = [
  { value: 'PERSON', label: 'Persona', description: 'Cliente natural con nombres y apellidos.' },
  { value: 'COMPANY', label: 'Empresa', description: 'Cliente jurídico con razón social.' }
];

export const identificationTypeOptions: CatalogOption<IdentificationType>[] = [
  { value: 'CEDULA', label: 'Cédula', description: 'Documento nacional de una persona.' },
  { value: 'RUC', label: 'RUC', description: 'Registro tributario de una empresa o contribuyente.' },
  { value: 'PASSPORT', label: 'Pasaporte', description: 'Documento internacional de identidad.' },
  { value: 'OTHER', label: 'Otro', description: 'Documento no clasificado en las opciones anteriores.' }
];

export const activeStatusOptions: CatalogOption<'true' | 'false'>[] = [
  { value: 'true', label: 'Activo', description: 'Puede usarse en procesos del taller.' },
  { value: 'false', label: 'Inactivo', description: 'Permanece registrado, pero no se usa operativamente.' }
];

export const currencyOptions: CatalogOption[] = [
  { value: 'USD', label: 'USD - Dólar estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'COP', label: 'COP - Peso colombiano' },
  { value: 'PEN', label: 'PEN - Sol peruano' }
];

export const timezoneOptions: CatalogOption[] = [
  { value: 'America/Guayaquil', label: 'America/Guayaquil' },
  { value: 'America/Bogota', label: 'America/Bogota' },
  { value: 'America/Lima', label: 'America/Lima' },
  { value: 'America/New_York', label: 'America/New_York' }
];

export const documentPrefixOptions: CatalogOption[] = [
  { value: 'OT', label: 'OT - Orden de trabajo', description: 'Ejemplo: OT-000001' },
  { value: 'COT', label: 'COT - Cotización', description: 'Ejemplo: COT-000001' },
  { value: 'FAC', label: 'FAC - Factura interna', description: 'Ejemplo: FAC-000001' }
];

export const fuelTypeOptions: CatalogOption<FuelType>[] = [
  { value: 'GASOLINE', label: 'Gasolina' },
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'HYBRID', label: 'Híbrido' },
  { value: 'ELECTRIC', label: 'Eléctrico' },
  { value: 'GAS', label: 'Gas' },
  { value: 'OTHER', label: 'Otro' }
];

export const transmissionTypeOptions: CatalogOption<TransmissionType>[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automática' },
  { value: 'CVT', label: 'CVT' },
  { value: 'OTHER', label: 'Otra' }
];

export const appointmentStatusOptions: CatalogOption<AppointmentStatus>[] = [
  { value: 'SCHEDULED', label: 'Programada', description: 'Cita registrada pendiente de confirmación.' },
  { value: 'CONFIRMED', label: 'Confirmada', description: 'El cliente confirmó la asistencia.' },
  { value: 'IN_PROGRESS', label: 'En proceso', description: 'El vehículo ya está siendo atendido.' },
  { value: 'COMPLETED', label: 'Completada', description: 'La cita terminó.' },
  { value: 'CANCELLED', label: 'Cancelada', description: 'La cita fue cancelada con motivo.' },
  { value: 'NO_SHOW', label: 'No asistió', description: 'El cliente no llegó a la cita.' }
];
