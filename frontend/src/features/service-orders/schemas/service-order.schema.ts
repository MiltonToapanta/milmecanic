import { z } from 'zod';

export const serviceOrderSchema = z.object({
  customerId: z.string().uuid('Seleccione un cliente'),
  vehicleId: z.string().uuid('Seleccione un vehículo'),
  appointmentId: z.string().optional(),
  assignedAdvisorId: z.string().optional(),
  assignedMechanicId: z.string().optional(),
  reportedMileage: z.coerce.number().int('Ingrese un número entero').min(0, 'El kilometraje no puede ser negativo'),
  fuelLevel: z.enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'], { error: 'Seleccione el nivel de combustible' }),
  customerRequest: z.string().trim().min(5, 'Ingrese al menos 5 caracteres').max(2000, 'Máximo 2000 caracteres'),
  initialDiagnosis: z.string().optional(),
  internalNotes: z.string().optional(),
  exteriorCondition: z.string().optional(),
  interiorCondition: z.string().optional(),
  receivedAccessories: z.string().optional(),
  customerSignatureName: z.string().optional(),
  workshopSignatureName: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  estimatedDeliveryTime: z.string().optional()
});

export type ServiceOrderSchemaInput = z.input<typeof serviceOrderSchema>;
export type ServiceOrderSchemaValues = z.output<typeof serviceOrderSchema>;
