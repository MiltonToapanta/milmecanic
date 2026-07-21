import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CarFront, ClipboardCheck, Gauge, Save, Settings2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { fuelTypeOptions, transmissionTypeOptions } from '../../../config/catalogs';
import { getCustomers } from '../../customers/api/customers.api';
import type { Customer } from '../../customers/types/customer.types';
import { vehicleSchema, type VehicleSchemaInput, type VehicleSchemaValues } from '../schemas/vehicle.schema';
import type { Vehicle, VehicleFormValues, VehiclePayload } from '../types/vehicle.types';

interface VehicleFormProps {
  vehicle?: Vehicle;
  initialCustomerId?: string;
  isSubmitting: boolean;
  onSubmit: (payload: VehiclePayload, isActive: boolean) => Promise<void>;
}

const defaultValues: VehicleFormValues = {
  customerId: '',
  plate: '',
  vin: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  engineNumber: '',
  chassisNumber: '',
  fuelType: 'GASOLINE',
  transmissionType: 'MANUAL',
  mileage: 0,
  notes: '',
  isActive: true
};

function toFormValues(vehicle?: Vehicle, initialCustomerId?: string): VehicleFormValues {
  if (!vehicle) return { ...defaultValues, customerId: initialCustomerId ?? '' };
  return {
    customerId: vehicle.customerId,
    plate: vehicle.plate,
    vin: vehicle.vin ?? '',
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color ?? '',
    engineNumber: vehicle.engineNumber ?? '',
    chassisNumber: vehicle.chassisNumber ?? '',
    fuelType: vehicle.fuelType,
    transmissionType: vehicle.transmissionType,
    mileage: vehicle.mileage,
    notes: vehicle.notes ?? '',
    isActive: vehicle.isActive
  };
}

function getCustomerLabel(customer: Customer): string {
  const name = customer.customerType === 'COMPANY' ? customer.businessName : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  return `${name || 'Cliente sin nombre'} · ${customer.identification}`;
}

function toPayload(values: VehicleSchemaValues): VehiclePayload {
  return {
    customerId: values.customerId,
    plate: values.plate,
    vin: values.vin,
    brand: values.brand,
    model: values.model,
    year: values.year,
    color: values.color,
    engineNumber: values.engineNumber,
    chassisNumber: values.chassisNumber,
    fuelType: values.fuelType,
    transmissionType: values.transmissionType,
    mileage: values.mileage,
    notes: values.notes
  };
}

export function VehicleForm({ vehicle, initialCustomerId, isSubmitting, onSubmit }: VehicleFormProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const customersQuery = useQuery({
    queryKey: ['vehicle-customer-options', customerSearch],
    queryFn: () => getCustomers({ page: 1, limit: 20, search: customerSearch, isActive: true })
  });
  const customerOptions = useMemo(() => {
    const customers = customersQuery.data?.items ?? [];
    if (!vehicle) return customers;
    const exists = customers.some((customer) => customer.id === vehicle.customerId);
    if (exists) return customers;
    return [
      {
        id: vehicle.customer.id,
        customerType: 'PERSON' as const,
        identificationType: 'OTHER' as const,
        identification: vehicle.customer.identification,
        firstName: vehicle.customer.displayName,
        lastName: '',
        businessName: null,
        email: null,
        phone: null,
        secondaryPhone: null,
        address: null,
        city: null,
        notes: null,
        isActive: true,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt
      },
      ...customers
    ];
  }, [customersQuery.data?.items, vehicle]);

  const form = useForm<VehicleSchemaInput, unknown, VehicleSchemaValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: toFormValues(vehicle, initialCustomerId)
  });

  useEffect(() => {
    form.reset(toFormValues(vehicle, initialCustomerId));
  }, [form, initialCustomerId, vehicle]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(toPayload(values), values.isActive);
  });

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><UserRound className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Cliente propietario</h2>
            <p className="mt-1 text-sm text-muted-foreground">Busque y seleccione un cliente activo. No se muestran clientes eliminados o inactivos.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Buscar cliente" helper="Puede buscar por nombre, razón social o identificación.">
            <Input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Buscar cliente..." />
          </FormField>
          <FormField label="Cliente" error={form.formState.errors.customerId?.message} helper="El vehículo quedará asociado a este cliente.">
            <select className="mm-select" {...form.register('customerId')}>
              <option value="">Seleccione un cliente</option>
              {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{getCustomerLabel(customer)}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><CarFront className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Datos del vehículo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Complete los datos básicos. La placa se guarda en mayúsculas automáticamente.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Placa" error={form.formState.errors.plate?.message} helper="Entre 5 y 10 caracteres. Ejemplo: ABC1234.">
            <Input {...form.register('plate')} onChange={(event) => form.setValue('plate', event.target.value.toUpperCase(), { shouldValidate: true })} />
          </FormField>
          <FormField label="VIN" error={form.formState.errors.vin?.message} helper="Opcional. Si lo ingresa debe tener entre 10 y 30 caracteres.">
            <Input {...form.register('vin')} />
          </FormField>
          <FormField label="Marca" error={form.formState.errors.brand?.message} helper="Ejemplo: Toyota, Chevrolet, Kia.">
            <Input {...form.register('brand')} />
          </FormField>
          <FormField label="Modelo" error={form.formState.errors.model?.message} helper="Ejemplo: Corolla, D-Max, Sportage.">
            <Input {...form.register('model')} />
          </FormField>
          <FormField label="Año" error={form.formState.errors.year?.message} helper="Año de fabricación o modelo.">
            <Input type="number" {...form.register('year')} />
          </FormField>
          <FormField label="Color" error={form.formState.errors.color?.message} helper="Opcional.">
            <Input {...form.register('color')} />
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><Settings2 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Ficha técnica</h2>
            <p className="mt-1 text-sm text-muted-foreground">Datos útiles para inspección, diagnóstico y futuras órdenes de servicio.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Número de motor" error={form.formState.errors.engineNumber?.message} helper="Opcional, útil para identificación técnica.">
          <Input {...form.register('engineNumber')} />
        </FormField>
        <FormField label="Número de chasis" error={form.formState.errors.chassisNumber?.message} helper="Opcional, útil para inspección.">
          <Input {...form.register('chassisNumber')} />
        </FormField>
        <FormField label="Combustible" error={form.formState.errors.fuelType?.message}>
          <select className="mm-select" {...form.register('fuelType')}>
            {fuelTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FormField>
        <FormField label="Transmisión" error={form.formState.errors.transmissionType?.message}>
          <select className="mm-select" {...form.register('transmissionType')}>
            {transmissionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FormField>
        <FormField label="Kilometraje" error={form.formState.errors.mileage?.message} helper="No puede ser negativo.">
          <Input type="number" min={0} {...form.register('mileage')} />
        </FormField>
        <FormField label="Estado" error={form.formState.errors.isActive?.message} helper="Inactivo conserva el registro, pero no se usa operativamente.">
          <select
            className="mm-select"
            value={form.watch('isActive') ? 'true' : 'false'}
            onChange={(event) => form.setValue('isActive', event.target.value === 'true', { shouldValidate: true })}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><ClipboardCheck className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Observaciones</h2>
            <p className="mt-1 text-sm text-muted-foreground">Notas visibles para el equipo del taller al consultar este vehículo.</p>
          </div>
        </div>
          <FormField label="Observaciones" error={form.formState.errors.notes?.message} helper="Notas internas sobre el vehículo.">
            <textarea className="mm-textarea" placeholder="Ejemplo: ruido al encender, pintura rayada, accesorios instalados..." {...form.register('notes')} />
          </FormField>
      </section>

      <div className="mm-automotive-band flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Gauge className="h-5 w-5 text-primary" />
          <span>Confirme placa, marca, modelo y kilometraje antes de guardar.</span>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar vehículo'}
        </Button>
      </div>
    </form>
  );
}
