import { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/button';
import { useCreateQuotation } from '../hooks/use-quotations';
import type { CreateQuotationPayload } from '../types/quotation.types';
import { QuotationForm } from '../components/quotation-form';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message ?? 'Error al crear la cotización';
  }
  return 'Error al crear la cotización';
}

export function CreateQuotationPage() {
  const navigate = useNavigate();
  const { serviceOrderId } = useParams<{ serviceOrderId?: string }>();
  const createMutation = useCreateQuotation();

  const handleSubmit = async (payload: CreateQuotationPayload) => {
    try {
      const quotation = await createMutation.mutateAsync(payload);
      toast.success(`Cotización ${quotation.quotationNumber} creada exitosamente`);
      void navigate(`/quotations/${quotation.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva cotización"
        description="Cree una cotización para una orden de servicio."
        action={
          <Button variant="ghost" onClick={() => void navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        }
      />
      <QuotationForm
        initialServiceOrderId={serviceOrderId}
        isSubmitting={createMutation.isPending}
        onSubmit={(payload) => handleSubmit(payload)}
      />
    </div>
  );
}
