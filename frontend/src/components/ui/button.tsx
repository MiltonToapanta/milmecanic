import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = 'primary', children, ...props }: PropsWithChildren<ButtonProps>) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'border border-border bg-card hover:bg-muted',
    ghost: 'hover:bg-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  return (
    <button
      className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
