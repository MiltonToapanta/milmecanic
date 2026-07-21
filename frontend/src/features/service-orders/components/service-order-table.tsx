import { Edit, Eye, RefreshCcw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { fuelLevelOptions } from '../../../config/catalogs';
import { useAuthStore } from '../../auth/store/auth.store';
import type { ServiceOrder } from '../types/service-order.types';
import { ServiceOrderStatusBadge } from './service-order-status-badge';

interface ServiceOrderTableProps {
  serviceOrders: ServiceOrder[];
  onChangeStatus: (serviceOrder: ServiceOrder) => void;
  onDelete: (serviceOrder: ServiceOrder) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(new Date(value));
}

function formatOptionalDate(value?: string | null): string {
  return value ? formatDate(value) : 'Sin fecha';
}

function canChangeStatus(order: ServiceOrder): boolean {
  return order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
}

export function ServiceOrderTable({ serviceOrders, onChangeStatus, onDelete }: ServiceOrderTableProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canUpdate = hasPermission('service-orders.update');
  const canChange = hasPermission('service-orders.change-status');
  const canDelete = hasPermission('service-orders.delete');

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Orden</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Vehículo</th>
            <th className="px-4 py-3 font-medium">Asesor</th>
            <th className="px-4 py-3 font-medium">Mecánico</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Entrega estimada</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {serviceOrders.map((order) => (
            <tr key={order.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">{fuelLevelOptions.find((option) => option.value === order.fuelLevel)?.label ?? order.fuelLevel} combustible</p>
              </td>
              <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{order.customer.displayName}</p>
                <p className="text-xs text-muted-foreground">{order.customer.identification}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{order.vehicle.plate}</p>
                <p className="text-xs text-muted-foreground">{order.vehicle.displayName}</p>
              </td>
              <td className="px-4 py-3">{order.assignedAdvisor?.displayName ?? 'Sin asesor'}</td>
              <td className="px-4 py-3">{order.assignedMechanic?.displayName ?? 'Sin mecánico'}</td>
              <td className="px-4 py-3"><ServiceOrderStatusBadge status={order.status} /></td>
              <td className="px-4 py-3">{formatOptionalDate(order.estimatedDeliveryAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" className="h-9 w-9 px-0" title="Ver">
                    <Link to={`/service-orders/${order.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  {canUpdate && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" title="Editar">
                      <Link to={`/service-orders/${order.id}/edit`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                  ) : null}
                  {canChange && canChangeStatus(order) ? (
                    <Button variant="secondary" className="h-9 px-3" onClick={() => onChangeStatus(order)} title="Cambiar estado">
                      <RefreshCcw className="h-4 w-4" />
                      Estado
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="ghost" className="h-9 w-9 px-0 text-red-600" onClick={() => onDelete(order)} title="Eliminar">
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
