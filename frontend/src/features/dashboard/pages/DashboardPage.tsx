import { CalendarDays, Car, DollarSign, ClipboardCheck } from 'lucide-react';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';

const cards = [
  { title: 'Órdenes activas', value: '12', icon: ClipboardCheck },
  { title: 'Vehículos en taller', value: '8', icon: Car },
  { title: 'Citas del día', value: '5', icon: CalendarDays },
  { title: 'Ingresos del mes', value: '$ 4,280', icon: DollarSign }
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Indicadores demostrativos para validar la estructura inicial." />
      <HelpPanel
        title="Inicio operativo"
        items={[
          'Use Clientes para registrar personas y empresas antes de módulos futuros.',
          'Use Usuarios para preparar el equipo del taller y asignar roles.',
          'Use Configuración para completar datos comerciales del taller.',
          'Las tarjetas actuales son demostrativas hasta implementar órdenes, citas e ingresos reales.'
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-md border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">Dato demostrativo</p>
          </article>
        ))}
      </div>
    </div>
  );
}
