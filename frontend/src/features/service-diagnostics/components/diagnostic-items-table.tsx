import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { categoryLabels } from '../schemas/service-diagnostic.schema';
import type { EditableDiagnosticItem, ServiceDiagnosticItem } from '../types/service-diagnostic.types';
import { DiagnosticItemStatusBadge, DiagnosticSeverityBadge } from './diagnostic-status-badge';

interface DiagnosticItemsTableProps {
  items: Array<ServiceDiagnosticItem | EditableDiagnosticItem>;
  editable?: boolean;
  onEdit?: (item: EditableDiagnosticItem) => void;
  onDelete?: (item: EditableDiagnosticItem) => void;
}

function getKey(item: ServiceDiagnosticItem | EditableDiagnosticItem): string {
  return 'localId' in item ? item.localId : item.id;
}

function toEditable(item: ServiceDiagnosticItem | EditableDiagnosticItem): EditableDiagnosticItem {
  if ('localId' in item) return item;
  return {
    id: item.id,
    localId: item.id,
    category: item.category,
    itemName: item.itemName,
    status: item.status,
    observation: item.observation ?? undefined,
    severity: item.severity ?? undefined
  };
}

export function DiagnosticItemsTable({ items, editable = false, onEdit, onDelete }: DiagnosticItemsTableProps) {
  const grouped = items.reduce<Record<string, Array<ServiceDiagnosticItem | EditableDiagnosticItem>>>((acc, item) => {
    acc[item.category] ??= [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (items.length === 0) {
    return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no hay ítems registrados.</div>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <section key={category} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <h3 className="text-sm font-semibold">{categoryLabels[category as keyof typeof categoryLabels]}</h3>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Elemento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Severidad</th>
                  <th className="px-4 py-3">Observación</th>
                  {editable ? <th className="px-4 py-3 text-right">Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {categoryItems.map((item) => (
                  <tr key={getKey(item)} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{categoryLabels[item.category]}</td>
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3"><DiagnosticItemStatusBadge status={item.status} /></td>
                    <td className="px-4 py-3"><DiagnosticSeverityBadge severity={item.severity} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{item.observation || 'Sin observación'}</td>
                    {editable ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" onClick={() => onEdit?.(toEditable(item))}><Edit className="h-4 w-4" /></Button>
                          <Button type="button" variant="danger" onClick={() => onDelete?.(toEditable(item))}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {categoryItems.map((item) => (
              <article key={getKey(item)} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabels[item.category]}</p>
                  </div>
                  <DiagnosticItemStatusBadge status={item.status} />
                </div>
                <div className="mt-3"><DiagnosticSeverityBadge severity={item.severity} /></div>
                <p className="mt-3 text-sm text-muted-foreground">{item.observation || 'Sin observación'}</p>
                {editable ? (
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => onEdit?.(toEditable(item))}><Edit className="h-4 w-4" />Editar</Button>
                    <Button type="button" variant="danger" onClick={() => onDelete?.(toEditable(item))}><Trash2 className="h-4 w-4" />Eliminar</Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
