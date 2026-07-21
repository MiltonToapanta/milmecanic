import { Button } from '../ui/button';

export function ConfirmDialog({ title, onConfirm }: { title: string; onConfirm: () => void }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="mb-3 text-sm">{title}</p>
      <Button variant="danger" onClick={onConfirm}>Confirmar</Button>
    </div>
  );
}
