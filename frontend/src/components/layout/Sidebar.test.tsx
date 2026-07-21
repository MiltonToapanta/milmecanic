import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('shows menu items according to permissions', () => {
    useAuthStore.setState({
      user: { id: '1', firstName: 'Admin', lastName: 'General', email: 'admin@milmecanic.local', isActive: true, roleId: 'r1', role: { id: 'r1', name: 'Administrador' }, permissions: ['users.read'] },
      isAuthenticated: true
    });
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.queryByText('Auditoría')).not.toBeInTheDocument();
  });
});
