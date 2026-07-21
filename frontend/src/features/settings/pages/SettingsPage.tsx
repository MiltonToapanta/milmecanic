import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { currencyOptions, documentPrefixOptions, timezoneOptions } from '../../../config/catalogs';
import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';

interface WorkshopSetting {
  id: string;
  tradeName: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  timezone: string;
  serviceOrderPrefix: string;
  quotationPrefix: string;
  internalInvoicePrefix: string;
}

async function getSettings(): Promise<WorkshopSetting> {
  const { data } = await apiClient.get<ApiResponse<WorkshopSetting>>('/settings');
  return data.data;
}

async function updateSettings(input: Partial<WorkshopSetting>): Promise<WorkshopSetting> {
  const { data } = await apiClient.patch<ApiResponse<WorkshopSetting>>('/settings', input);
  return data.data;
}

function getFormString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

function FieldGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mm-form-section">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function LabeledField({ label, helper, children }: { label: string; helper: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      <span className="block text-xs leading-5 text-muted-foreground">{helper}</span>
    </label>
  );
}

function PrefixSelect({ name, label, helper, defaultValue }: { name: string; label: string; helper: string; defaultValue?: string }) {
  return (
    <LabeledField label={label} helper={helper}>
      <select name={name} defaultValue={defaultValue} className="mm-select">
        {documentPrefixOptions.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {documentPrefixOptions.find((option) => option.value === defaultValue)?.description ?? 'Ejemplo: OT-000001'}
      </p>
    </LabeledField>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async () => {
      toast.success('Configuración actualizada');
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
  if (query.isLoading) return <LoadingState />;
  const settings = query.data;
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración del taller" description="Datos generales utilizados por los módulos futuros." />
      <HelpPanel
        title="Guía de configuración"
        items={[
          'Complete solo lo que conozca; puede volver y editar esta pantalla después.',
          'Nombre comercial es el nombre visible del taller.',
          'Moneda y zona horaria ayudan a mostrar valores y fechas correctamente.',
          'La numeración de documentos solo define las letras iniciales, por ejemplo OT-000001.'
        ]}
      />
      <form className="space-y-5" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        mutation.mutate({
          tradeName: getFormString(form, 'tradeName'),
          legalName: getFormString(form, 'legalName'),
          taxId: getFormString(form, 'taxId'),
          address: getFormString(form, 'address'),
          phone: getFormString(form, 'phone'),
          email: getFormString(form, 'email'),
          currency: getFormString(form, 'currency'),
          timezone: getFormString(form, 'timezone'),
          serviceOrderPrefix: getFormString(form, 'serviceOrderPrefix'),
          quotationPrefix: getFormString(form, 'quotationPrefix'),
          internalInvoicePrefix: getFormString(form, 'internalInvoicePrefix')
        });
      }}>
        <FieldGroup title="Datos principales" description="Información básica para identificar al taller.">
          <LabeledField label="Nombre del taller" helper="Ejemplo: MilMecanic Taller. Este nombre se verá en el sistema.">
            <Input name="tradeName" defaultValue={settings?.tradeName} placeholder="Nombre del taller" />
          </LabeledField>
          <LabeledField label="Razón social" helper="Nombre legal del negocio. Si no lo conoce, puede dejarlo vacío.">
            <Input name="legalName" defaultValue={settings?.legalName} placeholder="Razón social" />
          </LabeledField>
          <LabeledField label="RUC o identificación tributaria" helper="Número tributario usado para documentos internos.">
            <Input name="taxId" defaultValue={settings?.taxId} placeholder="RUC o identificación" />
          </LabeledField>
          <LabeledField label="Correo del taller" helper="Correo general para contacto con clientes.">
            <Input name="email" defaultValue={settings?.email} placeholder="correo@taller.com" />
          </LabeledField>
          <LabeledField label="Teléfono del taller" helper="Número principal para contacto.">
            <Input name="phone" defaultValue={settings?.phone} placeholder="Teléfono" />
          </LabeledField>
          <LabeledField label="Dirección" helper="Ubicación física del taller.">
            <Input name="address" defaultValue={settings?.address} placeholder="Dirección" />
          </LabeledField>
        </FieldGroup>

        <FieldGroup title="Moneda y horario" description="Seleccione opciones del catálogo para evitar errores de escritura.">
          <LabeledField label="Moneda" helper="Moneda que usará el taller para valores e informes.">
            <select name="currency" defaultValue={settings?.currency} className="mm-select">
              {currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Zona horaria" helper="Use America/Guayaquil para Ecuador. Esto ayuda a guardar fechas correctamente.">
            <select name="timezone" defaultValue={settings?.timezone} className="mm-select">
              {timezoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </LabeledField>
        </FieldGroup>

        <FieldGroup title="Numeración de documentos" description="Estas letras aparecen al inicio de cada documento. No cambian el número, solo ayudan a reconocer el tipo.">
          <PrefixSelect name="serviceOrderPrefix" label="Orden de trabajo" helper="Documento para registrar un trabajo del taller. Recomendado: OT." defaultValue={settings?.serviceOrderPrefix} />
          <PrefixSelect name="quotationPrefix" label="Cotización" helper="Documento para estimar costos antes de aprobar un trabajo. Recomendado: COT." defaultValue={settings?.quotationPrefix} />
          <PrefixSelect name="internalInvoicePrefix" label="Factura interna" helper="Documento interno para cobros o control administrativo. Recomendado: FAC." defaultValue={settings?.internalInvoicePrefix} />
        </FieldGroup>

        <div className="mm-automotive-band flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
      </form>
    </div>
  );
}
