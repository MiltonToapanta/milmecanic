import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => useAuthStore.getState().clearSession());

  it('redirects unauthenticated users', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<p>Login</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Privado</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
