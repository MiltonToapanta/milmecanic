import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { FormField } from '../../../components/forms/FormField';
import { useAuthStore } from '../store/auth.store';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values);
      toast.success('Bienvenido a MilMecanic');
      void navigate('/dashboard');
    } catch {
      toast.error('Credenciales inválidas');
    }
  });

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-[linear-gradient(135deg,#0f766e,#334155)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/15"><Wrench className="h-6 w-6" /></div>
          <div>
            <p className="text-xl font-semibold">MilMecanic</p>
            <p className="text-sm text-white/75">Gestión inteligente para talleres</p>
          </div>
        </div>
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-normal">Control operativo para talleres que trabajan con precisión.</h1>
          <p className="mt-4 text-white/75">Base administrativa preparada para usuarios, roles, permisos, configuración y auditoría.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={(event) => void onSubmit(event)} className="w-full max-w-md rounded-md border border-border bg-card p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-2xl font-semibold">MilMecanic</p>
            <p className="text-sm text-muted-foreground">Ingrese con sus credenciales del taller</p>
          </div>
          <div className="space-y-4">
            <FormField label="Correo" error={form.formState.errors.email?.message}>
              <Input autoComplete="email" {...form.register('email')} />
            </FormField>
            <FormField label="Contraseña" error={form.formState.errors.password?.message}>
              <Input type="password" autoComplete="current-password" {...form.register('password')} />
            </FormField>
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
