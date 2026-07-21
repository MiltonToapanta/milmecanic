import { AlertTriangle, CheckCircle2, CircleHelp, CircleMinus, Gauge, ShieldAlert } from 'lucide-react';
import type { ServiceDiagnosticItem } from '../types/service-diagnostic.types';
import { getDiagnosticSummary } from '../utils/diagnostic-summary';

export function DiagnosticSummary({ items }: { items: ServiceDiagnosticItem[] }) {
  const summary = getDiagnosticSummary(items);
  const cards = [
    { label: 'Total revisados', value: summary.total, icon: Gauge, className: 'text-cyan-600' },
    { label: 'Buenos', value: summary.good, icon: CheckCircle2, className: 'text-emerald-600' },
    { label: 'Regulares', value: summary.regular, icon: CircleMinus, className: 'text-amber-600' },
    { label: 'Malos', value: summary.bad, icon: AlertTriangle, className: 'text-red-600' },
    { label: 'No revisados', value: summary.notChecked, icon: CircleHelp, className: 'text-zinc-500' },
    { label: 'Críticos', value: summary.critical, icon: ShieldAlert, className: 'text-red-700' }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </div>
            <card.icon className={`h-7 w-7 ${card.className}`} />
          </div>
        </div>
      ))}
    </section>
  );
}
