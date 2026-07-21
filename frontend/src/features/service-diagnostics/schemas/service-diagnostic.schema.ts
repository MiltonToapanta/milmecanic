import { z } from 'zod';

export const diagnosticCategories = [
  'ENGINE',
  'BRAKES',
  'SUSPENSION',
  'STEERING',
  'TRANSMISSION',
  'ELECTRICAL',
  'BATTERY',
  'TIRES',
  'COOLING',
  'EXHAUST',
  'BODY',
  'LIGHTS',
  'FLUIDS',
  'OTHER'
] as const;

export const diagnosticItemStatuses = ['GOOD', 'REGULAR', 'BAD', 'NOT_CHECKED'] as const;
export const diagnosticSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const categoryLabels: Record<(typeof diagnosticCategories)[number], string> = {
  ENGINE: 'Motor',
  BRAKES: 'Frenos',
  SUSPENSION: 'Suspensión',
  STEERING: 'Dirección',
  TRANSMISSION: 'Transmisión',
  ELECTRICAL: 'Sistema eléctrico',
  BATTERY: 'Batería',
  TIRES: 'Neumáticos',
  COOLING: 'Refrigeración',
  EXHAUST: 'Escape',
  BODY: 'Carrocería',
  LIGHTS: 'Luces',
  FLUIDS: 'Fluidos',
  OTHER: 'Otros'
};

export const statusLabels: Record<(typeof diagnosticItemStatuses)[number], string> = {
  GOOD: 'Bueno',
  REGULAR: 'Regular',
  BAD: 'Malo',
  NOT_CHECKED: 'No revisado'
};

export const severityLabels: Record<(typeof diagnosticSeverities)[number], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
};

export const diagnosticItemSchema = z
  .object({
    id: z.string().optional(),
    localId: z.string(),
    category: z.enum(diagnosticCategories, { error: 'Seleccione una categoría' }),
    itemName: z.string().trim().min(1, 'Ingrese el elemento revisado'),
    status: z.enum(diagnosticItemStatuses, { error: 'Seleccione un estado' }),
    observation: z.string().trim().optional(),
    severity: z.enum(diagnosticSeverities).optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === 'BAD' && !value.observation?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['observation'], message: 'La observación es obligatoria cuando el estado es Malo' });
    }
    if (value.status === 'BAD' && !value.severity) {
      ctx.addIssue({ code: 'custom', path: ['severity'], message: 'La severidad es obligatoria cuando el estado es Malo' });
    }
  });

export const serviceDiagnosticSchema = z
  .object({
    generalObservation: z.string().trim().optional(),
    recommendation: z.string().trim().optional(),
    items: z.array(diagnosticItemSchema).min(1, 'Agregue al menos un ítem de diagnóstico')
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      const key = `${item.category}:${item.itemName.trim().toLocaleLowerCase()}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'itemName'],
          message: 'No puede duplicar el mismo elemento dentro de una categoría'
        });
      }
      seen.add(key);
    });
  });

export type ServiceDiagnosticFormValues = z.infer<typeof serviceDiagnosticSchema>;
