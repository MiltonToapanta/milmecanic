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
import { fuelTypeOptions, transmissionTypeOptions } from '../../../config/catalogs';
import { useAuthStore } from '../../auth/store/auth.store';
import { VehicleTable } from '../components/vehicle-table';
import { useActivateVehicle, useDeactivateVehicle, useDeleteVehicle, useVehicles } from '../hooks/use-vehicles';
import type { FuelType, TransmissionType, Vehicle, VehicleQuery } from '../types/vehicle.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

export function VehiclesPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [fuelType, setFuelType] = useState<FuelType | undefined>();
  const [transmissionType, setTransmissionType] = useState<TransmissionType | undefined>();
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const query: VehicleQuery = {
    page,
    limit: 10,
    search: [search, customerSearch].filter(Boolean).join(' ') || undefined,
    brand: brand || undefined,
    fuelType,
    transmissionType,
    isActive
  };
  const vehiclesQuery = useVehicles(query);
  const activateMutation = useActivateVehicle();
  const deactivateMutation = useDeactivateVehicle();
  const deleteMutation = useDeleteVehicle();
  const vehicles = vehiclesQuery.data?.items ?? [];
  const pagination = vehiclesQuery.data?.pagination;

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
        title="Vehículos"
        description="Administre los vehículos asociados a clientes existentes."
        action={hasPermission('vehicles.create') ? (
          <Button>
            <Link to="/vehicles/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo vehículo
            </Link>
          </Button>
        ) : null}
      />

      <HelpPanel
        title="Guía de vehículos"
        items={[
          'Cada vehículo debe pertenecer a un cliente activo.',
          'La placa no se puede repetir y se guarda en mayúsculas.',
          'Use los filtros para encontrar vehículos por cliente, marca, combustible, transmisión o estado.',
          'Eliminar un vehículo lo oculta del uso diario, pero conserva el registro.'
        ]}
      />

      <section className="mm-filter-panel lg:grid-cols-[1fr_220px_160px_180px_180px_150px]">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Buscar vehículo</span>
          <SearchInput value={search} onChange={(value) => { setPage(1); setSearch(value); }} placeholder="Placa, VIN, marca o modelo" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Cliente</span>
          <input className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nombre o identificación" value={customerSearch} onChange={(event) => { setPage(1); setCustomerSearch(event.target.value); }} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Marca</span>
          <input className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Toyota, Kia..." value={brand} onChange={(event) => { setPage(1); setBrand(event.target.value); }} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Combustible</span>
          <select className="mm-select" value={fuelType ?? ''} onChange={(event) => { setPage(1); setFuelType(event.target.value ? event.target.value as FuelType : undefined); }}>
            <option value="">Todo combustible</option>
            {fuelTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Transmisión</span>
          <select className="mm-select" value={transmissionType ?? ''} onChange={(event) => { setPage(1); setTransmissionType(event.target.value ? event.target.value as TransmissionType : undefined); }}>
            <option value="">Toda transmisión</option>
            {transmissionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Estado</span>
          <select className="mm-select" value={isActive === undefined ? '' : String(isActive)} onChange={(event) => { setPage(1); setIsActive(event.target.value === '' ? undefined : event.target.value === 'true'); }}>
            <option value="">Todo estado</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </label>
      </section>

      {vehiclesQuery.isLoading ? <LoadingState /> : null}
      {vehiclesQuery.isError ? <ErrorState message={getErrorMessage(vehiclesQuery.error)} /> : null}
      {!vehiclesQuery.isLoading && !vehiclesQuery.isError && vehicles.length === 0 ? <EmptyState title="No hay vehículos para mostrar" /> : null}
      {vehicles.length > 0 ? (
        <VehicleTable
          vehicles={vehicles}
          onActivate={(vehicle) => void runAction(() => activateMutation.mutateAsync(vehicle.id), 'Vehículo activado')}
          onDeactivate={(vehicle) => void runAction(() => deactivateMutation.mutateAsync(vehicle.id), 'Vehículo desactivado')}
          onDelete={setVehicleToDelete}
        />
      ) : null}

      {pagination ? (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Página {pagination.page} de {Math.max(pagination.totalPages, 1)} · {pagination.total} vehículos</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Anterior</Button>
            <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
          </div>
        </div>
      ) : null}

      {vehicleToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title={`¿Eliminar el vehículo ${vehicleToDelete.plate}? Esta acción será lógica y no removerá el historial.`}
              onConfirm={() => {
                void runAction(async () => {
                  await deleteMutation.mutateAsync(vehicleToDelete.id);
                  setVehicleToDelete(null);
                }, 'Vehículo eliminado');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setVehicleToDelete(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
