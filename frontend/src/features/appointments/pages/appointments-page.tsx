import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CalendarDays, List, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { EmptyState } from '../../../components/common/EmptyState';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { appointmentStatusOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../auth/store/auth.store';
import { getCustomers } from '../../customers/api/customers.api';
import { getUsers } from '../../users/api/users.api';
import { getVehiclesByCustomer } from '../../vehicles/api/vehicles.api';
import { AppointmentStatusBadge } from '../components/appointment-status-badge';
import { AppointmentStatusDialog } from '../components/appointment-status-dialog';
import { AppointmentTable } from '../components/appointment-table';
import { useAppointments, useChangeAppointmentStatus, useDeleteAppointment } from '../hooks/use-appointments';
import type { Appointment, AppointmentQuery, AppointmentStatus } from '../types/appointment.types';

type ViewMode = 'list' | 'calendar';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getMonthDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));
  const days: Date[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor));
  }
  return days;
}

function isSameDay(date: Date, value: string): boolean {
  const other = new Date(value);
  return date.getFullYear() === other.getFullYear() && date.getMonth() === other.getMonth() && date.getDate() === other.getDate();
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function CalendarView({ month, appointments, onPrevious, onNext, onSelect }: {
  month: Date;
  appointments: Appointment[];
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (appointment: Appointment) => void;
}) {
  const days = getMonthDays(month);
  const monthLabel = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(month);
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <section className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <Button variant="secondary" onClick={onPrevious}>Mes anterior</Button>
        <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
        <Button variant="secondary" onClick={onNext}>Mes siguiente</Button>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-muted text-center text-xs font-medium text-muted-foreground">
        {weekdays.map((day) => <div key={day} className="px-2 py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7">
        {days.map((day) => {
          const dayAppointments = appointments.filter((appointment) => isSameDay(day, appointment.scheduledAt));
          const outsideMonth = day.getMonth() !== month.getMonth();
          return (
            <div key={day.toISOString()} className={cn('min-h-36 border-b border-border p-2 md:border-r', outsideMonth && 'bg-muted/40 text-muted-foreground')}>
              <div className="mb-2 text-xs font-semibold">{day.getDate()}</div>
              <div className="space-y-2">
                {dayAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    className="w-full rounded-md border border-border bg-background p-2 text-left text-xs hover:border-primary"
                    onClick={() => onSelect(appointment)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{formatTime(appointment.scheduledAt)}</span>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                    <p className="mt-1 truncate">{appointment.customer.displayName}</p>
                    <p className="truncate text-muted-foreground">{appointment.vehicle.plate} · {appointment.reason}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AppointmentsPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [statusChange, setStatusChange] = useState<Appointment | null>(null);

  const customersQuery = useQuery({
    queryKey: ['appointments-filter-customers', customerSearch],
    queryFn: () => getCustomers({ page: 1, limit: 20, search: customerSearch, isActive: true })
  });
  const vehiclesQuery = useQuery({
    queryKey: ['appointments-filter-vehicles', selectedCustomerId],
    queryFn: () => getVehiclesByCustomer(selectedCustomerId, { page: 1, limit: 50, isActive: true }),
    enabled: Boolean(selectedCustomerId)
  });
  const usersQuery = useQuery({ queryKey: ['appointments-filter-users'], queryFn: getUsers });

  const listQuery: AppointmentQuery = {
    page,
    limit: 10,
    search: search || undefined,
    customerId: selectedCustomerId || undefined,
    vehicleId: selectedVehicleId || undefined,
    assignedUserId: assignedUserId || undefined,
    status,
    dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined
  };
  const calendarQuery: AppointmentQuery = {
    ...listQuery,
    page: 1,
    limit: 100,
    dateFrom: startOfMonth(calendarMonth).toISOString(),
    dateTo: endOfMonth(calendarMonth).toISOString()
  };
  const appointmentsQuery = useAppointments(viewMode === 'list' ? listQuery : calendarQuery);
  const changeStatusMutation = useChangeAppointmentStatus();
  const deleteMutation = useDeleteAppointment();
  const appointments = appointmentsQuery.data?.items ?? [];
  const pagination = appointmentsQuery.data?.pagination;

  const resetVehicleIfCustomerChanges = (customerId: string) => {
    setPage(1);
    setSelectedCustomerId(customerId);
    setSelectedVehicleId('');
  };

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const selectedCustomerName = useMemo(() => {
    const customer = customersQuery.data?.items.find((item) => item.id === selectedCustomerId);
    if (!customer) return '';
    return customer.customerType === 'COMPANY' ? customer.businessName ?? '' : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  }, [customersQuery.data?.items, selectedCustomerId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citas"
        description="Agende, consulte y actualice la atención de vehículos."
        action={hasPermission('appointments.create') ? (
          <Button>
            <Link to="/appointments/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva cita
            </Link>
          </Button>
        ) : null}
      />

      <HelpPanel
        title="Guía de citas"
        items={[
          'Use Lista para trabajar con filtros y acciones rápidas.',
          'Use Calendario para ver la agenda mensual por día.',
          'Al cancelar una cita siempre se solicita el motivo.',
          'Esta pantalla agenda la cita; todavía no crea órdenes de servicio.'
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant={viewMode === 'list' ? 'primary' : 'secondary'} onClick={() => setViewMode('list')}>
          <List className="h-4 w-4" />
          Lista
        </Button>
        <Button variant={viewMode === 'calendar' ? 'primary' : 'secondary'} onClick={() => setViewMode('calendar')}>
          <CalendarDays className="h-4 w-4" />
          Calendario
        </Button>
      </div>

      <section className="mm-filter-panel lg:grid-cols-[1fr_230px_220px_190px_180px_150px_150px]">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Buscar cita</span>
          <SearchInput value={search} onChange={(value) => { setPage(1); setSearch(value); }} placeholder="Cliente, placa, vehículo o motivo" />
        </label>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Cliente</span>
          <input className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Buscar cliente" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} />
          <select className="mm-select" value={selectedCustomerId} onChange={(event) => resetVehicleIfCustomerChanges(event.target.value)}>
            <option value="">Todo cliente</option>
            {customersQuery.data?.items.map((customer) => {
              const name = customer.customerType === 'COMPANY' ? customer.businessName : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
              return <option key={customer.id} value={customer.id}>{name || 'Cliente sin nombre'}</option>;
            })}
          </select>
        </div>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Vehículo</span>
          <select className="mm-select" value={selectedVehicleId} onChange={(event) => { setPage(1); setSelectedVehicleId(event.target.value); }} disabled={!selectedCustomerId}>
            <option value="">{selectedCustomerId ? `Vehículos de ${selectedCustomerName || 'cliente'}` : 'Todo vehículo'}</option>
            {vehiclesQuery.data?.items.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.brand} {vehicle.model}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Asignado</span>
          <select className="mm-select" value={assignedUserId} onChange={(event) => { setPage(1); setAssignedUserId(event.target.value); }}>
            <option value="">Todo asignado</option>
            {(usersQuery.data ?? []).filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Estado</span>
          <select className="mm-select" value={status ?? ''} onChange={(event) => { setPage(1); setStatus(event.target.value ? event.target.value as AppointmentStatus : undefined); }}>
            <option value="">Todo estado</option>
            {appointmentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Desde</span>
          <input className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30" type="date" value={dateFrom} onChange={(event) => { setPage(1); setDateFrom(event.target.value); }} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Hasta</span>
          <input className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30" type="date" value={dateTo} onChange={(event) => { setPage(1); setDateTo(event.target.value); }} />
        </label>
      </section>

      {appointmentsQuery.isLoading ? <LoadingState /> : null}
      {appointmentsQuery.isError ? <ErrorState message={getErrorMessage(appointmentsQuery.error)} /> : null}
      {!appointmentsQuery.isLoading && !appointmentsQuery.isError && appointments.length === 0 ? <EmptyState title="No hay citas para mostrar" /> : null}
      {appointments.length > 0 && viewMode === 'list' ? (
        <AppointmentTable appointments={appointments} onChangeStatus={setStatusChange} onDelete={setAppointmentToDelete} />
      ) : null}
      {appointments.length > 0 && viewMode === 'calendar' ? (
        <CalendarView
          month={calendarMonth}
          appointments={appointments}
          onPrevious={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          onNext={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          onSelect={(appointment) => void navigate(`/appointments/${appointment.id}/edit`)}
        />
      ) : null}

      {pagination && viewMode === 'list' ? (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Página {pagination.page} de {Math.max(pagination.totalPages, 1)} · {pagination.total} citas</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Anterior</Button>
            <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
          </div>
        </div>
      ) : null}

      {appointmentToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title={`¿Eliminar la cita de ${appointmentToDelete.customer.displayName}? Esta acción será lógica y conservará la trazabilidad.`}
              onConfirm={() => {
                void runAction(async () => {
                  await deleteMutation.mutateAsync(appointmentToDelete.id);
                  setAppointmentToDelete(null);
                }, 'Cita eliminada');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setAppointmentToDelete(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}

      {statusChange ? (
        <AppointmentStatusDialog
          appointment={statusChange}
          onCancel={() => setStatusChange(null)}
          onConfirm={(nextStatus, cancellationReason) => {
            void runAction(async () => {
              await changeStatusMutation.mutateAsync({
                id: statusChange.id,
                payload: { status: nextStatus, cancellationReason }
              });
              setStatusChange(null);
            }, 'Estado de la cita actualizado');
          }}
        />
      ) : null}
    </div>
  );
}
