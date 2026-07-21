import { Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import type { Customer } from '../types/customer.types';
import { CustomerStatusBadge } from './customer-status-badge';

interface CustomerTableProps {
  customers: Customer[];
  onActivate: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function getCustomerName(customer: Customer): string {
  if (customer.customerType === 'COMPANY') return customer.businessName ?? 'Empresa sin razón social';
  return `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Cliente sin nombre';
}

function getCustomerTypeLabel(type: Customer['customerType']): string {
  return type === 'PERSON' ? 'Persona' : 'Empresa';
}

export function CustomerTable({ customers, onActivate, onDeactivate, onDelete }: CustomerTableProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canUpdate = hasPermission('customers.update');
  const canChangeStatus = hasPermission('customers.change-status');
  const canDelete = hasPermission('customers.delete');

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Identificación</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Correo</th>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{getCustomerName(customer)}</td>
              <td className="px-4 py-3">{customer.identification}</td>
              <td className="px-4 py-3">{getCustomerTypeLabel(customer.customerType)}</td>
              <td className="px-4 py-3">{customer.email ?? '-'}</td>
              <td className="px-4 py-3">{customer.phone ?? '-'}</td>
              <td className="px-4 py-3"><CustomerStatusBadge active={customer.isActive} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {canUpdate ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" title="Editar">
                      <Link to={`/customers/${customer.id}/edit`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                  ) : null}
                  {canChangeStatus && customer.isActive ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" onClick={() => onDeactivate(customer)} title="Desactivar">
                      <PowerOff className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canChangeStatus && !customer.isActive ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" onClick={() => onActivate(customer)} title="Activar">
                      <Power className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="ghost" className="h-9 w-9 px-0 text-red-600" onClick={() => onDelete(customer)} title="Eliminar">
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
