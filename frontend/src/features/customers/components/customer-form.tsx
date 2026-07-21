import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Phone, Save, StickyNote, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { activeStatusOptions, customerTypeOptions, identificationTypeOptions } from '../../../config/catalogs';
import { customerSchema, type CustomerSchemaInput, type CustomerSchemaValues } from '../schemas/customer.schema';
import type { Customer, CustomerFormValues, CustomerPayload } from '../types/customer.types';

interface CustomerFormProps {
  customer?: Customer;
  isSubmitting: boolean;
  onSubmit: (payload: CustomerPayload, isActive: boolean) => Promise<void>;
}

const defaultValues: CustomerFormValues = {
  customerType: 'PERSON',
  identificationType: 'CEDULA',
  identification: '',
  firstName: '',
  lastName: '',
  businessName: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  address: '',
  city: '',
  notes: '',
  isActive: true
};

function toFormValues(customer?: Customer): CustomerFormValues {
  if (!customer) return defaultValues;
  return {
    customerType: customer.customerType,
    identificationType: customer.identificationType,
    identification: customer.identification,
    firstName: customer.firstName ?? '',
    lastName: customer.lastName ?? '',
    businessName: customer.businessName ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    secondaryPhone: customer.secondaryPhone ?? '',
    address: customer.address ?? '',
    city: customer.city ?? '',
    notes: customer.notes ?? '',
    isActive: customer.isActive
  };
}

function toPayload(values: CustomerSchemaValues): CustomerPayload {
  return {
    customerType: values.customerType,
    identificationType: values.identificationType,
    identification: values.identification,
    firstName: values.customerType === 'PERSON' ? values.firstName : undefined,
    lastName: values.customerType === 'PERSON' ? values.lastName : undefined,
    businessName: values.customerType === 'COMPANY' ? values.businessName : undefined,
    email: values.email,
    phone: values.phone,
    secondaryPhone: values.secondaryPhone,
    address: values.address,
    city: values.city,
    notes: values.notes
  };
}

export function CustomerForm({ customer, isSubmitting, onSubmit }: CustomerFormProps) {
  const form = useForm<CustomerSchemaInput, unknown, CustomerSchemaValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: toFormValues(customer)
  });
  const customerType = form.watch('customerType');

  useEffect(() => {
    form.reset(toFormValues(customer));
  }, [customer, form]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(toPayload(values), values.isActive);
  });

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><UserRound className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Identidad del cliente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Defina si registra una persona o empresa y complete el documento principal.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tipo de cliente" error={form.formState.errors.customerType?.message} helper="Persona usa nombres y apellidos; Empresa usa razón social.">
          <select className="mm-select" {...form.register('customerType')}>
            {customerTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FormField>
        <FormField label="Estado" error={form.formState.errors.isActive?.message} helper="Mantenga Activo si el cliente puede usarse en nuevos procesos.">
          <select
            className="mm-select"
            value={form.watch('isActive') ? 'true' : 'false'}
            onChange={(event) => form.setValue('isActive', event.target.value === 'true', { shouldValidate: true })}
          >
            {activeStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FormField>
        {customerType === 'PERSON' ? (
          <>
            <FormField label="Nombres" error={form.formState.errors.firstName?.message} helper="Ingrese los nombres tal como desea verlos en documentos.">
              <Input {...form.register('firstName')} />
            </FormField>
            <FormField label="Apellidos" error={form.formState.errors.lastName?.message} helper="Use los apellidos principales del cliente.">
              <Input {...form.register('lastName')} />
            </FormField>
          </>
        ) : (
          <FormField label="Razón social" error={form.formState.errors.businessName?.message} helper="Nombre legal o comercial que identifica a la empresa.">
            <Input {...form.register('businessName')} />
          </FormField>
        )}
        <FormField label="Tipo de identificación" error={form.formState.errors.identificationType?.message} helper="Seleccione el catálogo que corresponda al documento recibido.">
          <select className="mm-select" {...form.register('identificationType')}>
            {identificationTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FormField>
        <FormField label="Identificación" error={form.formState.errors.identification?.message} helper="Debe tener entre 5 y 20 caracteres y no puede repetirse.">
          <Input {...form.register('identification')} />
        </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><Phone className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Contacto</h2>
            <p className="mt-1 text-sm text-muted-foreground">Datos rápidos para llamar, escribir o ubicar al cliente cuando llegue el vehículo.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Correo" error={form.formState.errors.email?.message} helper="Opcional; útil para aprobaciones y comunicaciones futuras.">
          <Input type="email" {...form.register('email')} />
        </FormField>
        <FormField label="Teléfono" error={form.formState.errors.phone?.message} helper="Número principal de contacto, entre 7 y 20 caracteres.">
          <Input {...form.register('phone')} />
        </FormField>
        <FormField label="Teléfono secundario" error={form.formState.errors.secondaryPhone?.message} helper="Opcional para contacto alternativo.">
          <Input {...form.register('secondaryPhone')} />
        </FormField>
        <FormField label="Ciudad" error={form.formState.errors.city?.message}>
          <Input {...form.register('city')} />
        </FormField>
        <FormField label="Dirección" error={form.formState.errors.address?.message}>
          <Input {...form.register('address')} />
        </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><StickyNote className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Notas internas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Información útil para asesores y recepción. No escriba contraseñas ni datos sensibles.</p>
          </div>
        </div>
        <div className="md:col-span-2">
          <FormField label="Notas" error={form.formState.errors.notes?.message}>
            <textarea className="mm-textarea" placeholder="Ejemplo: prefiere contacto por WhatsApp, horario de atención, referencias del taller..." {...form.register('notes')} />
          </FormField>
        </div>
      </section>
      <div className="mm-automotive-band flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <FileText className="h-5 w-5 text-primary" />
          <span>Revise identificación y teléfono antes de guardar la ficha.</span>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
        </Button>
      </div>
    </form>
  );
}
