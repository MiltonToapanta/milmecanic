import { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/button';
import { useQuotation, useUpdateQuotation } from '../hooks/use-quotations';
import type { CreateQuotationPayload } from '../types/quotation.types';
import { QuotationForm } from '../components/quotation-form';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message ?? 'Error al actualizar';
  }
  return 'Error al actualizar';
}

export function EditQuotationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const quotationQuery = useQuotation(id!);
  const updateMutation = useUpdateQuotation();

  if (quotationQuery.isLoading) return <LoadingState />;
  if (quotationQuery.isError || !quotationQuery.data) {
    return <ErrorState message="No se pudo cargar la cotización" />;
  }

  const quotation = quotationQuery.data;

  if (quotation.status !== 'DRAFT') {
    return (
      <div className="space-y-4">
        <PageHeader title="Editar cotización" />
        <p className="text-sm text-muted-foreground">Solo se pueden editar cotizaciones en estado borrador.</p>
        <Button variant="ghost" onClick={() => void navigate(`/quotations/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Ver cotización
        </Button>
      </div>
    );
  }

  const handleSubmit = async (payload: CreateQuotationPayload) => {
    try {
      await updateMutation.mutateAsync({ id: id!, payload });
      toast.success('Cotización actualizada');
      void navigate(`/quotations/${id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar cotización ${quotation.quotationNumber}`}
        action={
          <Button variant="ghost" onClick={() => void navigate(`/quotations/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        }
      />
      <QuotationForm
        quotation={quotation}
        isSubmitting={updateMutation.isPending}
        onSubmit={(payload) => handleSubmit(payload)}
      />
    </div>
  );
}
