import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CarFront, ClipboardList, Save, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getCustomers } from '../../customers/api/customers.api';
import type { Customer } from '../../customers/types/customer.types';
import { getUsers } from '../../users/api/users.api';
import { getVehiclesByCustomer } from '../../vehicles/api/vehicles.api';
import type { Vehicle } from '../../vehicles/types/vehicle.types';
import { appointmentSchema, type AppointmentSchemaInput, type AppointmentSchemaValues } from '../schemas/appointment.schema';
import type { Appointment, AppointmentFormValues, AppointmentPayload } from '../types/appointment.types';

interface AppointmentFormProps {
  appointment?: Appointment;
  initialCustomerId?: string;
  initialVehicleId?: string;
  isSubmitting: boolean;
  onSubmit: (payload: AppointmentPayload) => Promise<void>;
}

const defaultValues: AppointmentFormValues = {
  customerId: '',
  vehicleId: '',
  assignedUserId: '',
  date: '',
  time: '',
  estimatedDurationMinutes: 60,
  reason: '',
  notes: ''
};

function toDateInput(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeInput(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toFormValues(appointment?: Appointment, initialCustomerId?: string, initialVehicleId?: string): AppointmentFormValues {
  if (!appointment) return { ...defaultValues, customerId: initialCustomerId ?? '', vehicleId: initialVehicleId ?? '' };
  return {
    customerId: appointment.customerId,
    vehicleId: appointment.vehicleId,
    assignedUserId: appointment.assignedUserId ?? '',
    date: toDateInput(appointment.scheduledAt),
    time: toTimeInput(appointment.scheduledAt),
    estimatedDurationMinutes: appointment.estimatedDurationMinutes,
    reason: appointment.reason,
    notes: appointment.notes ?? ''
  };
}

function getCustomerLabel(customer: Customer): string {
  const name = customer.customerType === 'COMPANY' ? customer.businessName : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  return `${name || 'Cliente sin nombre'} · ${customer.identification}`;
}

function getVehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`;
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function toPayload(values: AppointmentSchemaValues): AppointmentPayload {
  return {
    customerId: values.customerId,
    vehicleId: values.vehicleId,
    assignedUserId: values.assignedUserId,
    scheduledAt: combineDateTime(values.date, values.time),
    estimatedDurationMinutes: values.estimatedDurationMinutes,
    reason: values.reason,
    notes: values.notes
  };
}

export function AppointmentForm({ appointment, initialCustomerId, initialVehicleId, isSubmitting, onSubmit }: AppointmentFormProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [lastCustomerId, setLastCustomerId] = useState(initialCustomerId ?? appointment?.customerId ?? '');
  const form = useForm<AppointmentSchemaInput, unknown, AppointmentSchemaValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: toFormValues(appointment, initialCustomerId, initialVehicleId)
  });
  const selectedCustomerId = form.watch('customerId');

  const customersQuery = useQuery({
    queryKey: ['appointment-customer-options', customerSearch],
    queryFn: () => getCustomers({ page: 1, limit: 20, search: customerSearch, isActive: true })
  });

  const vehiclesQuery = useQuery({
    queryKey: ['appointment-vehicle-options', selectedCustomerId],
    queryFn: () => getVehiclesByCustomer(selectedCustomerId, { page: 1, limit: 50, isActive: true }),
    enabled: Boolean(selectedCustomerId)
  });

  const usersQuery = useQuery({ queryKey: ['appointment-user-options'], queryFn: getUsers });

  useEffect(() => {
    form.reset(toFormValues(appointment, initialCustomerId, initialVehicleId));
    setLastCustomerId(initialCustomerId ?? appointment?.customerId ?? '');
  }, [appointment, form, initialCustomerId, initialVehicleId]);

  useEffect(() => {
    if (!selectedCustomerId || !lastCustomerId) {
      setLastCustomerId(selectedCustomerId);
      return;
    }
    if (selectedCustomerId !== lastCustomerId) {
      form.setValue('vehicleId', '', { shouldValidate: true });
      setLastCustomerId(selectedCustomerId);
    }
  }, [form, lastCustomerId, selectedCustomerId]);

  const customerOptions = useMemo(() => {
    const customers = customersQuery.data?.items ?? [];
    if (!appointment) return customers;
    const exists = customers.some((customer) => customer.id === appointment.customerId);
    if (exists) return customers;
    return [
      {
        id: appointment.customer.id,
        customerType: 'PERSON' as const,
        identificationType: 'OTHER' as const,
        identification: appointment.customer.identification,
        firstName: appointment.customer.displayName,
        lastName: '',
        businessName: null,
        email: null,
        phone: null,
        secondaryPhone: null,
        address: null,
        city: null,
        notes: null,
        isActive: true,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      },
      ...customers
    ];
  }, [appointment, customersQuery.data?.items]);

  const vehicleOptions = useMemo(() => {
    const vehicles = vehiclesQuery.data?.items ?? [];
    if (!appointment) return vehicles;
    const exists = vehicles.some((vehicle) => vehicle.id === appointment.vehicleId);
    if (exists) return vehicles;
    return [
      {
        id: appointment.vehicle.id,
        customerId: appointment.customerId,
        plate: appointment.vehicle.plate,
        brand: appointment.vehicle.displayName.split(' ')[0] ?? appointment.vehicle.displayName,
        model: appointment.vehicle.displayName.split(' ').slice(1).join(' '),
        year: new Date(appointment.scheduledAt).getFullYear(),
        fuelType: 'OTHER' as const,
        transmissionType: 'OTHER' as const,
        mileage: 0,
        isActive: true,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        customer: appointment.customer
      },
      ...vehicles
    ];
  }, [appointment, vehiclesQuery.data?.items]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(toPayload(values));
  });

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><CarFront className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Cliente y vehículo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Seleccione primero el cliente. Después se mostrarán únicamente sus vehículos activos.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Buscar cliente" helper="Busque por nombre, razón social o identificación.">
            <Input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Buscar cliente..." />
          </FormField>
          <FormField label="Cliente" error={form.formState.errors.customerId?.message}>
            <select className="mm-select" {...form.register('customerId')}>
              <option value="">Seleccione un cliente</option>
              {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{getCustomerLabel(customer)}</option>)}
            </select>
          </FormField>
          <FormField label="Vehículo" error={form.formState.errors.vehicleId?.message} helper="Formato: placa - marca modelo.">
            <select className="mm-select" {...form.register('vehicleId')} disabled={!selectedCustomerId}>
              <option value="">{selectedCustomerId ? 'Seleccione un vehículo' : 'Seleccione primero un cliente'}</option>
              {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{getVehicleLabel(vehicle)}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><CalendarClock className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Agenda</h2>
            <p className="mt-1 text-sm text-muted-foreground">Defina cuándo se atenderá el vehículo y cuánto tiempo estima el trabajo inicial.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Fecha" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register('date')} />
        </FormField>
        <FormField label="Hora" error={form.formState.errors.time?.message}>
          <Input type="time" {...form.register('time')} />
        </FormField>
        <FormField label="Duración estimada" error={form.formState.errors.estimatedDurationMinutes?.message} helper="Entre 15 y 480 minutos.">
          <Input type="number" min={15} max={480} step={15} {...form.register('estimatedDurationMinutes')} />
        </FormField>
        <FormField label="Usuario asignado" error={form.formState.errors.assignedUserId?.message} helper="Opcional. Puede quedar sin asignar.">
          <select className="mm-select" {...form.register('assignedUserId')}>
            <option value="">Sin asignar</option>
            {(usersQuery.data ?? []).filter((user) => user.isActive).map((user) => (
              <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
            ))}
          </select>
        </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Motivo de la cita</h2>
            <p className="mt-1 text-sm text-muted-foreground">Escriba una descripción clara de lo que el cliente solicita.</p>
          </div>
        </div>
        <div className="grid gap-4">
        <FormField label="Motivo" error={form.formState.errors.reason?.message} helper="Ejemplo: mantenimiento preventivo, diagnóstico de frenos, cambio de aceite.">
          <Input {...form.register('reason')} />
        </FormField>
        <FormField label="Observaciones" error={form.formState.errors.notes?.message} helper="Opcional. Use este campo para notas internas.">
          <textarea className="mm-textarea" placeholder="Ejemplo: cliente esperará en sala, revisar ruido en frío, confirmar repuesto..." {...form.register('notes')} />
        </FormField>
        </div>
      </section>

      <div className="mm-automotive-band flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <UserRound className="h-5 w-5 text-primary" />
          <span>Antes de guardar, confirme cliente, vehículo, fecha y hora.</span>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar cita'}
        </Button>
      </div>
    </form>
  );
}
