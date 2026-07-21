import { z } from 'zod';

const optionalText = z.union([z.literal(''), z.string()]).optional().transform((value) => value || undefined);
const optionalEmail = z
  .union([z.literal(''), z.string().email('Ingrese un correo válido')])
  .optional()
  .transform((value) => value || undefined);
const optionalPhone = z
  .union([z.literal(''), z.string().min(7, 'Debe tener al menos 7 caracteres').max(20, 'Debe tener máximo 20 caracteres')])
  .optional()
  .transform((value) => value || undefined);

export const customerSchema = z
  .object({
    customerType: z.enum(['PERSON', 'COMPANY'], { message: 'Seleccione el tipo de cliente' }),
    identificationType: z.enum(['CEDULA', 'RUC', 'PASSPORT', 'OTHER'], { message: 'Seleccione el tipo de identificación' }),
    identification: z.string().min(5, 'Debe tener al menos 5 caracteres').max(20, 'Debe tener máximo 20 caracteres'),
    firstName: optionalText,
    lastName: optionalText,
    businessName: optionalText,
    email: optionalEmail,
    phone: optionalPhone,
    secondaryPhone: optionalPhone,
    address: optionalText,
    city: optionalText,
    notes: optionalText,
    isActive: z.boolean()
  })
  .superRefine((value, context) => {
    if (value.customerType === 'PERSON') {
      if (!value.firstName?.trim()) {
        context.addIssue({ code: 'custom', path: ['firstName'], message: 'Ingrese los nombres' });
      }
      if (!value.lastName?.trim()) {
        context.addIssue({ code: 'custom', path: ['lastName'], message: 'Ingrese los apellidos' });
      }
    }
    if (value.customerType === 'COMPANY' && !value.businessName?.trim()) {
      context.addIssue({ code: 'custom', path: ['businessName'], message: 'Ingrese la razón social' });
    }
  });

export type CustomerSchemaValues = z.infer<typeof customerSchema>;
export type CustomerSchemaInput = z.input<typeof customerSchema>;
