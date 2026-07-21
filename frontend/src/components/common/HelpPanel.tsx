import { Info } from 'lucide-react';

interface HelpPanelProps {
  title: string;
  items: string[];
}

export function HelpPanel({ title, items }: HelpPanelProps) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Info className="h-4 w-4 text-primary" />
        {title}
      </div>
      <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="leading-6">{item}</li>
        ))}
      </ul>
    </section>
  );
}
