import type { LabelHTMLAttributes, PropsWithChildren } from 'react';

export function Label({ children, ...props }: PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>) {
  return <label className="text-sm font-medium" {...props}>{children}</label>;
}
