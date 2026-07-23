import { AxiosError } from 'axios';
import { Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { useQuotations } from '../hooks/use-quotations';
import type { QuotationStatus, QuotationQuery } from '../types/quotation.types';
import { formatCurrency, formatOptionalDate } from '../components/quotation-helpers';
import { QuotationStatusBadge } from '../components/quotation-status-badge';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message ?? 'Error al realizar la operación';
  }
  return 'Error al realizar la operación';
}

export function QuotationsPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuotationStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const query: QuotationQuery = {
    page,
    limit: 15,
    search: search || undefined,
    status: (status as QuotationStatus) || undefined,
    dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined
  };

  const quotationsQuery = useQuotations(query);

  const quotations = quotationsQuery.data?.items ?? [];
  const pagination = quotationsQuery.data?.pagination;

  const statusOptions: { value: QuotationStatus; label: string }[] = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'SENT', label: 'Enviada' },
    { value: 'APPROVED', label: 'Aprobada' },
    { value: 'REJECTED', label: 'Rechazada' },
    { value: 'EXPIRED', label: 'Vencida' },
    { value: 'CANCELLED', label: 'Cancelada' }
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cotizaciones"
        description="Gestione las cotizaciones del taller."
        action={
          hasPermission('quotations.create') ? (
            <Button onClick={() => void navigate('/quotations/new')}>
              <Plus className="mr-2 h-4 w-4" /> Nueva cotización
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por número, cliente, placa..." />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as QuotationStatus | ''); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {statusOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-md border border-border bg-background px-3 py-2 text-sm" title="Desde" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-md border border-border bg-background px-3 py-2 text-sm" title="Hasta" />
      </div>

      {/* Content */}
      {quotationsQuery.isLoading ? (
        <LoadingState />
      ) : quotationsQuery.isError ? (
        <ErrorState message={getErrorMessage(quotationsQuery.error)} />
      ) : quotations.length === 0 ? (
        <EmptyState title="Sin cotizaciones" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Cotización</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Vehículo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{q.quotationNumber}</td>
                    <td className="px-4 py-3">{formatOptionalDate(q.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/service-orders/${q.serviceOrderId}`} className="text-primary hover:underline">
                        {q.serviceOrder.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{q.serviceOrder.customer.displayName}</td>
                    <td className="px-4 py-3">{q.serviceOrder.vehicle.plate}</td>
                    <td className="px-4 py-3"><QuotationStatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">{formatOptionalDate(q.validUntil)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(q.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/quotations/${q.id}`}>
                          <Button variant="ghost"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {q.status === 'DRAFT' && hasPermission('quotations.update') && (
                          <Link to={`/quotations/${q.id}/edit`}>
                            <Button variant="ghost">Editar</Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{pagination.total} cotizaciones</span>
              <div className="flex gap-2">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                <span className="flex items-center px-2">Pág. {page} de {pagination.totalPages}</span>
                <Button variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
