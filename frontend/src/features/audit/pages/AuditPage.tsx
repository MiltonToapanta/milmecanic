import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../../components/common/DataTable';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';

interface AuditLog {
  id: string;
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

async function getAuditLogs(): Promise<AuditLog[]> {
  const { data } = await apiClient.get<ApiResponse<AuditLog[]>>('/audit');
  return data.data;
}

export function AuditPage() {
  const query = useQuery({ queryKey: ['audit'], queryFn: getAuditLogs });
  return (
    <div className="space-y-6">
      <PageHeader title="Auditoría" description="Registro de acciones relevantes del sistema." />
      <HelpPanel
        title="Guía de auditoría"
        items={[
          'Aquí se registran inicios de sesión, cierres, creaciones, cambios y eliminaciones lógicas.',
          'Use la fecha y el usuario para rastrear quién realizó una acción.',
          'El módulo y la entidad ayudan a ubicar el área afectada.',
          'La auditoría no se edita desde la interfaz para conservar trazabilidad.'
        ]}
      />
      {query.isLoading ? <LoadingState /> : (
        <DataTable<AuditLog> rows={query.data ?? []} columns={[
          { header: 'Fecha', render: (log) => new Date(log.createdAt).toLocaleString('es-EC') },
          { header: 'Usuario', render: (log) => log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema' },
          { header: 'Módulo', render: (log) => log.module },
          { header: 'Acción', render: (log) => log.action },
          { header: 'Entidad', render: (log) => log.entity ?? '-' }
        ]} />
      )}
    </div>
  );
}
