import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { EmptyState } from '../../../components/common/EmptyState';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { serviceOrderStatusOptions } from '../../../config/catalogs';
import { useAuthStore } from '../../auth/store/auth.store';
import { getCustomers } from '../../customers/api/customers.api';
import { getUsers } from '../../users/api/users.api';
import { getVehiclesByCustomer } from '../../vehicles/api/vehicles.api';
import { ServiceOrderStatusDialog } from '../components/service-order-status-dialog';
import { ServiceOrderTable } from '../components/service-order-table';
import { useChangeServiceOrderStatus, useDeleteServiceOrder, useServiceOrders } from '../hooks/use-service-orders';
import type { ServiceOrder, ServiceOrderQuery, ServiceOrderStatus } from '../types/service-order.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

export function ServiceOrdersPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assignedAdvisorId, setAssignedAdvisorId] = useState('');
  const [assignedMechanicId, setAssignedMechanicId] = useState('');
  const [status, setStatus] = useState<ServiceOrderStatus | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [statusChange, setStatusChange] = useState<ServiceOrder | null>(null);

  const customersQuery = useQuery({
    queryKey: ['service-orders-filter-customers', customerSearch],
    queryFn: () => getCustomers({ page: 1, limit: 20, search: customerSearch, isActive: true })
  });
  const vehiclesQuery = useQuery({
    queryKey: ['service-orders-filter-vehicles', selectedCustomerId],
    queryFn: () => getVehiclesByCustomer(selectedCustomerId, { page: 1, limit: 50, isActive: true }),
    enabled: Boolean(selectedCustomerId)
  });
  const usersQuery = useQuery({ queryKey: ['service-orders-filter-users'], queryFn: getUsers });

  const query: ServiceOrderQuery = {
    page,
    limit: 10,
    search: search || undefined,
    customerId: selectedCustomerId || undefined,
    vehicleId: selectedVehicleId || undefined,
    assignedAdvisorId: assignedAdvisorId || undefined,
    assignedMechanicId: assignedMechanicId || undefined,
    status,
    dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined
  };

  const serviceOrdersQuery = useServiceOrders(query);
  const deleteMutation = useDeleteServiceOrder();
  const changeStatusMutation = useChangeServiceOrderStatus();
  const serviceOrders = serviceOrdersQuery.data?.items ?? [];
  const pagination = serviceOrdersQuery.data?.pagination;

  const selectedCustomerName = useMemo(() => {
    const customer = customersQuery.data?.items.find((item) => item.id === selectedCustomerId);
    if (!customer) return '';
    return customer.customerType === 'COMPANY' ? customer.businessName ?? '' : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  }, [customersQuery.data?.items, selectedCustomerId]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de servicio"
        description="Controle la recepción, avance y entrega de trabajos del taller."
        action={hasPermission('service-orders.create') ? (
          <Button>
            <Link to="/service-orders/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva orden
            </Link>
          </Button>
        ) : null}
      />

      <HelpPanel
        title="Guía de órdenes"
        items={[
          'Cada orden nace en estado Recibido y avanza paso a paso.',
          'Use los filtros para ubicar órdenes por cliente, vehículo, asesor, mecánico o fechas.',
          'El número de orden se genera automáticamente desde la configuración del taller.',
          'Las órdenes entregadas o canceladas ya no se editan.'
        ]}
      />

      <section className="mm-filter-panel lg:grid-cols-[1fr_220px_210px_180px_180px_180px_150px_150px]">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Buscar orden</span>
          <SearchInput value={search} onChange={(value) => { setPage(1); setSearch(value); }} placeholder="Orden, cliente, placa o solicitud" />
        </label>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Cliente</span>
          <InputLike value={customerSearch} onChange={setCustomerSearch} placeholder="Buscar cliente" />
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
          <span className="text-xs font-semibold text-muted-foreground">Asesor</span>
          <select className="mm-select" value={assignedAdvisorId} onChange={(event) => { setPage(1); setAssignedAdvisorId(event.target.value); }}>
            <option value="">Todo asesor</option>
            {(usersQuery.data ?? []).filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Mecánico</span>
          <select className="mm-select" value={assignedMechanicId} onChange={(event) => { setPage(1); setAssignedMechanicId(event.target.value); }}>
            <option value="">Todo mecánico</option>
            {(usersQuery.data ?? []).filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Estado</span>
          <select className="mm-select" value={status ?? ''} onChange={(event) => { setPage(1); setStatus(event.target.value ? event.target.value as ServiceOrderStatus : undefined); }}>
            <option value="">Todo estado</option>
            {serviceOrderStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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

      {serviceOrdersQuery.isLoading ? <LoadingState /> : null}
      {serviceOrdersQuery.isError ? <ErrorState message={getErrorMessage(serviceOrdersQuery.error)} /> : null}
      {!serviceOrdersQuery.isLoading && !serviceOrdersQuery.isError && serviceOrders.length === 0 ? <EmptyState title="No hay órdenes de servicio para mostrar" /> : null}
      {serviceOrders.length > 0 ? <ServiceOrderTable serviceOrders={serviceOrders} onChangeStatus={setStatusChange} onDelete={setOrderToDelete} /> : null}

      {pagination ? (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Página {pagination.page} de {Math.max(pagination.totalPages, 1)} · {pagination.total} órdenes</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Anterior</Button>
            <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
          </div>
        </div>
      ) : null}

      {orderToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title={`¿Eliminar la orden ${orderToDelete.orderNumber}? Esta acción será lógica y conserva la trazabilidad.`}
              onConfirm={() => {
                void runAction(async () => {
                  await deleteMutation.mutateAsync(orderToDelete.id);
                  setOrderToDelete(null);
                }, 'Orden eliminada');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setOrderToDelete(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}

      {statusChange ? (
        <ServiceOrderStatusDialog
          serviceOrder={statusChange}
          onCancel={() => setStatusChange(null)}
          onConfirm={(nextStatus, cancellationReason) => {
            void runAction(async () => {
              await changeStatusMutation.mutateAsync({ id: statusChange.id, payload: { status: nextStatus, cancellationReason } });
              setStatusChange(null);
            }, 'Estado de la orden actualizado');
          }}
        />
      ) : null}
    </div>
  );
}

function InputLike({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}
