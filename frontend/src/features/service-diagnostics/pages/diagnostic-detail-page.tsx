import { AxiosError } from 'axios';
import { ArrowLeft, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { DiagnosticItemsTable } from '../components/diagnostic-items-table';
import { DiagnosticStatusBadge } from '../components/diagnostic-status-badge';
import { DiagnosticSummary } from '../components/diagnostic-summary';
import { useCompleteServiceDiagnostic, useDeleteServiceDiagnostic, useServiceDiagnosticByOrder } from '../hooks/use-service-diagnostics';
import { categoryLabels } from '../schemas/service-diagnostic.schema';
import { useState } from 'react';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function TextBlock({ title, value }: { title: string; value?: string | null }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{value || 'Sin registrar'}</p>
    </section>
  );
}

export function DiagnosticDetailPage() {
  const { serviceOrderId } = useParams<{ serviceOrderId: string }>();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const diagnosticQuery = useServiceDiagnosticByOrder(serviceOrderId ?? '');
  const completeMutation = useCompleteServiceDiagnostic();
  const deleteMutation = useDeleteServiceDiagnostic();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const diagnostic = diagnosticQuery.data;

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (diagnosticQuery.isLoading) return <LoadingState />;
  if (diagnosticQuery.isError) return <ErrorState message={getErrorMessage(diagnosticQuery.error)} />;
  if (!diagnostic || !serviceOrderId) return <ErrorState message="La orden no tiene un diagnóstico técnico registrado." />;

  const canEdit = !diagnostic.completedAt && hasPermission('service-diagnostics.update');
  const canComplete = !diagnostic.completedAt && diagnostic.items.length > 0 && hasPermission('service-diagnostics.complete');
  const canDelete = !diagnostic.completedAt && hasPermission('service-diagnostics.delete');
  const categories = Array.from(new Set(diagnostic.items.map((item) => item.category))).map((category) => categoryLabels[category]).join(', ');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Diagnóstico ${diagnostic.serviceOrder.orderNumber}`}
        description={`${diagnostic.serviceOrder.customer.displayName} · ${diagnostic.serviceOrder.vehicle.plate} · ${diagnostic.serviceOrder.vehicle.displayName}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">
              <Link to={`/service-orders/${serviceOrderId}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a la orden
              </Link>
            </Button>
            {canEdit ? (
              <Button variant="secondary">
                <Link to={`/service-orders/${serviceOrderId}/diagnostic/edit`} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            ) : null}
            {canComplete ? (
              <Button onClick={() => setCompleteOpen(true)}><CheckCircle2 className="h-4 w-4" />Completar diagnóstico</Button>
            ) : null}
            {canDelete ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" />Eliminar</Button>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Estado del diagnóstico</p>
          <div className="mt-2"><DiagnosticStatusBadge diagnostic={diagnostic} /></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Fecha de creación</p>
          <p className="mt-2 text-sm font-medium">{formatDateTime(diagnostic.createdAt)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Fecha de finalización</p>
          <p className="mt-2 text-sm font-medium">{formatDateTime(diagnostic.completedAt)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Categorías revisadas</p>
          <p className="mt-2 text-sm font-medium">{categories || 'Sin ítems'}</p>
        </div>
      </section>

      <DiagnosticSummary items={diagnostic.items} />

      <section className="grid gap-4 lg:grid-cols-2">
        <TextBlock title="Observación general" value={diagnostic.generalObservation} />
        <TextBlock title="Recomendación" value={diagnostic.recommendation} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Ítems agrupados por categoría</h2>
          <p className="mt-1 text-sm text-muted-foreground">Detalle real de cada revisión técnica registrada.</p>
        </div>
        <DiagnosticItemsTable items={diagnostic.items} />
      </section>

      {completeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title="¿Completar el diagnóstico? Después de completarlo ya no podrá modificarse."
              onConfirm={() => {
                void runAction(async () => {
                  await completeMutation.mutateAsync(diagnostic.id);
                  setCompleteOpen(false);
                }, 'Diagnóstico técnico completado');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setCompleteOpen(false)}>Cancelar</Button>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title="¿Eliminar este diagnóstico técnico? La eliminación será lógica."
              onConfirm={() => {
                void runAction(async () => {
                  await deleteMutation.mutateAsync(diagnostic.id);
                  void navigate(`/service-orders/${serviceOrderId}`);
                }, 'Diagnóstico técnico eliminado');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
