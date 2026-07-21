import { z } from 'zod';

const optionalText = z.union([z.literal(''), z.string()]).optional().transform((value) => value || undefined);

export const appointmentSchema = z.object({
  customerId: z.string().min(1, 'Seleccione un cliente'),
  vehicleId: z.string().min(1, 'Seleccione un vehículo'),
  assignedUserId: optionalText,
  date: z.string().min(1, 'Seleccione la fecha'),
  time: z.string().min(1, 'Seleccione la hora'),
  estimatedDurationMinutes: z.coerce
    .number()
    .int('Ingrese una duración válida')
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 480 minutos'),
  reason: z.string().min(3, 'Ingrese al menos 3 caracteres').max(250, 'Debe tener máximo 250 caracteres'),
  notes: optionalText
});

export type AppointmentSchemaValues = z.infer<typeof appointmentSchema>;
export type AppointmentSchemaInput = z.input<typeof appointmentSchema>;
