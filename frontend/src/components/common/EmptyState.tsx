export function EmptyState({ title }: { title: string }) {
  return <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{title}</div>;
}
