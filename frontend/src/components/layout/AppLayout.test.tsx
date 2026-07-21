import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('renders base layout', () => {
    useAuthStore.setState({
      user: { id: '1', firstName: 'Admin', lastName: 'General', email: 'admin@milmecanic.local', isActive: true, roleId: 'r1', role: { id: 'r1', name: 'Administrador' }, permissions: ['users.read'] },
      isAuthenticated: true,
      accessToken: 'token',
      refreshToken: 'refresh'
    });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes><Route element={<AppLayout />}><Route path="/dashboard" element={<p>Contenido</p>} /></Route></Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Gestión inteligente para talleres')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});
