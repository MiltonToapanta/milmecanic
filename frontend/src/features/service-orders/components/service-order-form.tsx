import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CarFront, ClipboardList, Gauge, Save, UserRound, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { fuelLevelOptions } from '../../../config/catalogs';
import { getAppointmentsByCustomer } from '../../appointments/api/appointments.api';
import type { Appointment } from '../../appointments/types/appointment.types';
import { getCustomers } from '../../customers/api/customers.api';
import type { Customer } from '../../customers/types/customer.types';
import { getUsers } from '../../users/api/users.api';
import { getVehiclesByCustomer } from '../../vehicles/api/vehicles.api';
import type { Vehicle } from '../../vehicles/types/vehicle.types';
import { serviceOrderSchema, type ServiceOrderSchemaInput, type ServiceOrderSchemaValues } from '../schemas/service-order.schema';
import type { ServiceOrder, ServiceOrderPayload } from '../types/service-order.types';

interface ServiceOrderFormProps {
  serviceOrder?: ServiceOrder;
  initialCustomerId?: string;
  initialVehicleId?: string;
  isSubmitting: boolean;
  onSubmit: (payload: ServiceOrderPayload) => Promise<void>;
}

const defaultValues: ServiceOrderSchemaInput = {
  customerId: '',
  vehicleId: '',
  appointmentId: '',
  assignedAdvisorId: '',
  assignedMechanicId: '',
  reportedMileage: 0,
  fuelLevel: 'HALF',
  customerRequest: '',
  initialDiagnosis: '',
  internalNotes: '',
  estimatedDeliveryDate: '',
  estimatedDeliveryTime: ''
};

function toDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toFormValues(serviceOrder?: ServiceOrder, initialCustomerId?: string, initialVehicleId?: string): ServiceOrderSchemaInput {
  if (!serviceOrder) return { ...defaultValues, customerId: initialCustomerId ?? '', vehicleId: initialVehicleId ?? '' };
  return {
    customerId: serviceOrder.customerId,
    vehicleId: serviceOrder.vehicleId,
    appointmentId: serviceOrder.appointmentId ?? '',
    assignedAdvisorId: serviceOrder.assignedAdvisorId ?? '',
    assignedMechanicId: serviceOrder.assignedMechanicId ?? '',
    reportedMileage: serviceOrder.reportedMileage,
    fuelLevel: serviceOrder.fuelLevel,
    customerRequest: serviceOrder.customerRequest,
    initialDiagnosis: serviceOrder.initialDiagnosis ?? '',
    internalNotes: serviceOrder.internalNotes ?? '',
    estimatedDeliveryDate: toDateInput(serviceOrder.estimatedDeliveryAt),
    estimatedDeliveryTime: toTimeInput(serviceOrder.estimatedDeliveryAt)
  };
}

function getCustomerLabel(customer: Customer): string {
  const name = customer.customerType === 'COMPANY' ? customer.businessName : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  return `${name || 'Cliente sin nombre'} · ${customer.identification}`;
}

function getVehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`;
}

function formatAppointment(appointment: Appointment): string {
  const date = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(appointment.scheduledAt));
  return `${date} · ${appointment.vehicle.plate} · ${appointment.reason}`;
}

function combineOptionalDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T${time || '17:00'}:00`).toISOString();
}

function emptyToUndefined(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toPayload(values: ServiceOrderSchemaValues): ServiceOrderPayload {
  return {
    customerId: values.customerId,
    vehicleId: values.vehicleId,
    appointmentId: emptyToUndefined(values.appointmentId),
    assignedAdvisorId: emptyToUndefined(values.assignedAdvisorId),
    assignedMechanicId: emptyToUndefined(values.assignedMechanicId),
    reportedMileage: values.reportedMileage,
    fuelLevel: values.fuelLevel,
    customerRequest: values.customerRequest,
    initialDiagnosis: emptyToUndefined(values.initialDiagnosis),
    internalNotes: emptyToUndefined(values.internalNotes),
    estimatedDeliveryAt: combineOptionalDateTime(values.estimatedDeliveryDate ?? '', values.estimatedDeliveryTime ?? '')
  };
}

export function ServiceOrderForm({ serviceOrder, initialCustomerId, initialVehicleId, isSubmitting, onSubmit }: ServiceOrderFormProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [lastCustomerId, setLastCustomerId] = useState(initialCustomerId ?? serviceOrder?.customerId ?? '');
  const [lastVehicleId, setLastVehicleId] = useState(initialVehicleId ?? serviceOrder?.vehicleId ?? '');
  const form = useForm<ServiceOrderSchemaInput, unknown, ServiceOrderSchemaValues>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: toFormValues(serviceOrder, initialCustomerId, initialVehicleId)
  });
  const selectedCustomerId = form.watch('customerId');
  const selectedVehicleId = form.watch('vehicleId');

  const customersQuery = useQuery({
    queryKey: ['service-order-customer-options', customerSearch],
    queryFn: () => getCustomers({ page: 1, limit: 20, search: customerSearch, isActive: true })
  });
  const vehiclesQuery = useQuery({
    queryKey: ['service-order-vehicle-options', selectedCustomerId],
    queryFn: () => getVehiclesByCustomer(selectedCustomerId, { page: 1, limit: 50, isActive: true }),
    enabled: Boolean(selectedCustomerId)
  });
  const appointmentsQuery = useQuery({
    queryKey: ['service-order-appointment-options', selectedCustomerId, selectedVehicleId],
    queryFn: () => getAppointmentsByCustomer(selectedCustomerId, { page: 1, limit: 50, vehicleId: selectedVehicleId }),
    enabled: Boolean(selectedCustomerId && selectedVehicleId)
  });
  const usersQuery = useQuery({ queryKey: ['service-order-user-options'], queryFn: getUsers });

  useEffect(() => {
    form.reset(toFormValues(serviceOrder, initialCustomerId, initialVehicleId));
    setLastCustomerId(initialCustomerId ?? serviceOrder?.customerId ?? '');
    setLastVehicleId(initialVehicleId ?? serviceOrder?.vehicleId ?? '');
  }, [form, initialCustomerId, initialVehicleId, serviceOrder]);

  useEffect(() => {
    if (!selectedCustomerId || !lastCustomerId) {
      setLastCustomerId(selectedCustomerId);
      return;
    }
    if (selectedCustomerId !== lastCustomerId) {
      form.setValue('vehicleId', '', { shouldValidate: true });
      form.setValue('appointmentId', '');
      setLastCustomerId(selectedCustomerId);
    }
  }, [form, lastCustomerId, selectedCustomerId]);

  useEffect(() => {
    if (!selectedVehicleId || !lastVehicleId) {
      setLastVehicleId(selectedVehicleId);
      return;
    }
    if (selectedVehicleId !== lastVehicleId) {
      form.setValue('appointmentId', '');
      setLastVehicleId(selectedVehicleId);
    }
  }, [form, lastVehicleId, selectedVehicleId]);

  const customerOptions = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data?.items]);
  const vehicleOptions = useMemo(() => vehiclesQuery.data?.items ?? [], [vehiclesQuery.data?.items]);
  const appointmentOptions = useMemo(
    () => (appointmentsQuery.data?.items ?? []).filter((appointment) => appointment.vehicleId === selectedVehicleId && appointment.status !== 'CANCELLED'),
    [appointmentsQuery.data?.items, selectedVehicleId]
  );
  const activeUsers = useMemo(() => (usersQuery.data ?? []).filter((user) => user.isActive), [usersQuery.data]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(toPayload(values));
  });

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><CarFront className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Cliente, vehículo y cita</h2>
            <p className="mt-1 text-sm text-muted-foreground">Seleccione el cliente primero. El sistema mostrará solo sus vehículos activos y citas válidas.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Buscar cliente" helper="Nombre, razón social o identificación.">
            <Input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Buscar cliente..." />
          </FormField>
          <FormField label="Cliente" error={form.formState.errors.customerId?.message}>
            <select className="mm-select" {...form.register('customerId')}>
              <option value="">Seleccione un cliente</option>
              {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{getCustomerLabel(customer)}</option>)}
            </select>
          </FormField>
          <FormField label="Vehículo" error={form.formState.errors.vehicleId?.message}>
            <select className="mm-select" {...form.register('vehicleId')} disabled={!selectedCustomerId}>
              <option value="">{selectedCustomerId ? 'Seleccione un vehículo' : 'Seleccione primero un cliente'}</option>
              {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{getVehicleLabel(vehicle)}</option>)}
            </select>
          </FormField>
          <FormField label="Cita relacionada" error={form.formState.errors.appointmentId?.message} helper="Opcional. Solo citas del cliente y vehículo seleccionados.">
            <select className="mm-select" {...form.register('appointmentId')} disabled={!selectedVehicleId}>
              <option value="">Sin cita relacionada</option>
              {appointmentOptions.map((appointment) => <option key={appointment.id} value={appointment.id}>{formatAppointment(appointment)}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><UserRound className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Responsables</h2>
            <p className="mt-1 text-sm text-muted-foreground">Asigne quién atiende al cliente y quién trabajará el vehículo.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Asesor" error={form.formState.errors.assignedAdvisorId?.message}>
            <select className="mm-select" {...form.register('assignedAdvisorId')}>
              <option value="">Sin asesor</option>
              {activeUsers.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
            </select>
          </FormField>
          <FormField label="Mecánico" error={form.formState.errors.assignedMechanicId?.message}>
            <select className="mm-select" {...form.register('assignedMechanicId')}>
              <option value="">Sin mecánico</option>
              {activeUsers.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><Gauge className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Recepción del vehículo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Registre datos rápidos al recibir el vehículo en el taller.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <FormField label="Kilometraje reportado" error={form.formState.errors.reportedMileage?.message}>
            <Input type="number" min={0} {...form.register('reportedMileage')} />
          </FormField>
          <FormField label="Nivel de combustible" error={form.formState.errors.fuelLevel?.message}>
            <select className="mm-select" {...form.register('fuelLevel')}>
              <option value="">Seleccione nivel</option>
              {fuelLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </FormField>
          <FormField label="Fecha estimada" error={form.formState.errors.estimatedDeliveryDate?.message}>
            <Input type="date" {...form.register('estimatedDeliveryDate')} />
          </FormField>
          <FormField label="Hora estimada" error={form.formState.errors.estimatedDeliveryTime?.message}>
            <Input type="time" {...form.register('estimatedDeliveryTime')} />
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Solicitud y diagnóstico</h2>
            <p className="mt-1 text-sm text-muted-foreground">Explique con palabras simples qué pide el cliente y qué observa el taller.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField label="Solicitud del cliente" error={form.formState.errors.customerRequest?.message} helper="Ejemplo: ruido al frenar, mantenimiento preventivo, revisión de motor.">
            <textarea className="mm-textarea" {...form.register('customerRequest')} />
          </FormField>
          <FormField label="Diagnóstico inicial" error={form.formState.errors.initialDiagnosis?.message} helper="Opcional. Primera observación al recibir el vehículo.">
            <textarea className="mm-textarea" {...form.register('initialDiagnosis')} />
          </FormField>
          <FormField label="Notas internas" error={form.formState.errors.internalNotes?.message} helper="Opcional. Información visible solo para el equipo del taller.">
            <textarea className="mm-textarea" {...form.register('internalNotes')} />
          </FormField>
        </div>
      </section>

      <div className="mm-automotive-band flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Wrench className="h-5 w-5 text-primary" />
          <span>El número de orden se genera automáticamente al guardar.</span>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar orden'}
        </Button>
      </div>
    </form>
  );
}
