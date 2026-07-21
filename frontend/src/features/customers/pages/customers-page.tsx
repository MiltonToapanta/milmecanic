import { AxiosError } from 'axios';
import { Plus } from 'lucide-react';
import { useState } from 'react';
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
import { activeStatusOptions, customerTypeOptions, identificationTypeOptions } from '../../../config/catalogs';
import { useAuthStore } from '../../auth/store/auth.store';
import { CustomerTable } from '../components/customer-table';
import {
  useActivateCustomer,
  useCustomers,
  useDeactivateCustomer,
  useDeleteCustomer
} from '../hooks/use-customers';
import type { Customer, CustomerQuery, CustomerType, IdentificationType } from '../types/customer.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

export function CustomersPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | undefined>();
  const [identificationType, setIdentificationType] = useState<IdentificationType | undefined>();
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const query: CustomerQuery = { page, limit: 10, search, customerType, identificationType, isActive };
  const customersQuery = useCustomers(query);
  const activateMutation = useActivateCustomer();
  const deactivateMutation = useDeactivateCustomer();
  const deleteMutation = useDeleteCustomer();

  const pagination = customersQuery.data?.pagination;
  const customers = customersQuery.data?.items ?? [];

  const updateSearch = (value: string) => {
    setPage(1);
    setSearch(value);
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
        title="Clientes"
        description="Gestione personas y empresas registradas en el taller."
        action={hasPermission('customers.create') ? (
          <Button>
            <Link to="/customers/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Link>
          </Button>
        ) : null}
      />

      <HelpPanel
        title="Guía de clientes"
        items={[
          'Use Persona para clientes particulares y Empresa cuando el registro tenga razón social.',
          'La identificación no se repite entre clientes activos; si el sistema avisa duplicado, busque primero el registro existente.',
          'Inactivo conserva el registro, pero evita usarlo en procesos operativos.',
          'El buscador revisa identificación, nombre, razón social, correo y teléfono.'
        ]}
      />

      <section className="mm-filter-panel sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Buscar cliente</span>
          <SearchInput value={search} onChange={updateSearch} placeholder="Nombre, cédula, correo o teléfono" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Tipo</span>
          <select className="mm-select" value={customerType ?? ''} onChange={(event) => {
            setPage(1);
            setCustomerType(event.target.value ? event.target.value as CustomerType : undefined);
          }}>
            <option value="">Todos los tipos</option>
            {customerTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Identificación</span>
          <select className="mm-select" value={identificationType ?? ''} onChange={(event) => {
            setPage(1);
            setIdentificationType(event.target.value ? event.target.value as IdentificationType : undefined);
          }}>
            <option value="">Toda identificación</option>
            {identificationTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Estado</span>
          <select className="mm-select" value={isActive === undefined ? '' : String(isActive)} onChange={(event) => {
            setPage(1);
            setIsActive(event.target.value === '' ? undefined : event.target.value === 'true');
          }}>
            <option value="">Todo estado</option>
            {activeStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </section>

      {customersQuery.isLoading ? <LoadingState /> : null}
      {customersQuery.isError ? <ErrorState message={getErrorMessage(customersQuery.error)} /> : null}
      {!customersQuery.isLoading && !customersQuery.isError && customers.length === 0 ? <EmptyState title="No hay clientes para mostrar" /> : null}
      {customers.length > 0 ? (
        <CustomerTable
          customers={customers}
          onActivate={(customer) => void runAction(() => activateMutation.mutateAsync(customer.id), 'Cliente activado')}
          onDeactivate={(customer) => void runAction(() => deactivateMutation.mutateAsync(customer.id), 'Cliente desactivado')}
          onDelete={setCustomerToDelete}
        />
      ) : null}

      {pagination ? (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Página {pagination.page} de {Math.max(pagination.totalPages, 1)} · {pagination.total} clientes</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Anterior</Button>
            <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
          </div>
        </div>
      ) : null}

      {customerToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title={`¿Eliminar el cliente ${customerToDelete.identification}? Esta acción será lógica y no removerá el historial.`}
              onConfirm={() => {
                void runAction(async () => {
                  await deleteMutation.mutateAsync(customerToDelete.id);
                  setCustomerToDelete(null);
                }, 'Cliente eliminado');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setCustomerToDelete(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
