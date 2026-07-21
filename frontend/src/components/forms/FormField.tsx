import type { ReactNode } from 'react';
import { Label } from '../ui/label';

interface FormFieldProps {
  label: string;
  error?: string;
  helper?: string;
  children: ReactNode;
}

export function FormField({ label, error, helper, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {helper ? <p className="text-xs leading-5 text-muted-foreground">{helper}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
