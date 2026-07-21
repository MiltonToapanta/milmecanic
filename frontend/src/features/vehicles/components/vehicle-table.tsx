import { Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import type { Vehicle } from '../types/vehicle.types';
import { FuelBadge, VehicleStatusBadge } from './vehicle-status-badge';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onActivate: (vehicle: Vehicle) => void;
  onDeactivate: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export function VehicleTable({ vehicles, onActivate, onDeactivate, onDelete }: VehicleTableProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canUpdate = hasPermission('vehicles.update');
  const canChangeStatus = hasPermission('vehicles.change-status');
  const canDelete = hasPermission('vehicles.delete');

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[940px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Placa</th>
            <th className="px-4 py-3 font-medium">Vehículo</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Año</th>
            <th className="px-4 py-3 font-medium">Combustible</th>
            <th className="px-4 py-3 font-medium">Kilometraje</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="border-t border-border">
              <td className="px-4 py-3 font-semibold">{vehicle.plate}</td>
              <td className="px-4 py-3">{vehicle.brand} {vehicle.model}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{vehicle.customer.displayName}</p>
                <p className="text-xs text-muted-foreground">{vehicle.customer.identification}</p>
              </td>
              <td className="px-4 py-3">{vehicle.year}</td>
              <td className="px-4 py-3"><FuelBadge fuelType={vehicle.fuelType} /></td>
              <td className="px-4 py-3">{vehicle.mileage.toLocaleString('es-EC')} km</td>
              <td className="px-4 py-3"><VehicleStatusBadge active={vehicle.isActive} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {canUpdate ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" title="Editar">
                      <Link to={`/vehicles/${vehicle.id}/edit`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                  ) : null}
                  {canChangeStatus && vehicle.isActive ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" onClick={() => onDeactivate(vehicle)} title="Desactivar">
                      <PowerOff className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canChangeStatus && !vehicle.isActive ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" onClick={() => onActivate(vehicle)} title="Activar">
                      <Power className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="ghost" className="h-9 w-9 px-0 text-red-600" onClick={() => onDelete(vehicle)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
