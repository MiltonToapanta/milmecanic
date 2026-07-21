import { z } from 'zod';

const currentYear = new Date().getFullYear();
const optionalText = z.union([z.literal(''), z.string()]).optional().transform((value) => value || undefined);
const optionalVin = z
  .union([z.literal(''), z.string().min(10, 'Debe tener al menos 10 caracteres').max(30, 'Debe tener máximo 30 caracteres')])
  .optional()
  .transform((value) => value || undefined);

export const vehicleSchema = z.object({
  customerId: z.string().min(1, 'Seleccione un cliente'),
  plate: z.string().min(5, 'Debe tener al menos 5 caracteres').max(10, 'Debe tener máximo 10 caracteres').transform((value) => value.trim().replace(/\s+/gu, '').toUpperCase()),
  vin: optionalVin,
  brand: z.string().min(1, 'Ingrese la marca').max(80, 'Debe tener máximo 80 caracteres'),
  model: z.string().min(1, 'Ingrese el modelo').max(80, 'Debe tener máximo 80 caracteres'),
  year: z.coerce.number().int('Ingrese un año válido').min(1900, 'El año mínimo es 1900').max(currentYear + 1, `El año máximo es ${currentYear + 1}`),
  color: optionalText,
  engineNumber: optionalText,
  chassisNumber: optionalText,
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GAS', 'OTHER'], { message: 'Seleccione el combustible' }),
  transmissionType: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'OTHER'], { message: 'Seleccione la transmisión' }),
  mileage: z.coerce.number().int('Ingrese un kilometraje válido').min(0, 'El kilometraje no puede ser negativo'),
  notes: optionalText,
  isActive: z.boolean()
});

export type VehicleSchemaValues = z.infer<typeof vehicleSchema>;
export type VehicleSchemaInput = z.input<typeof vehicleSchema>;
