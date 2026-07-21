import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    expect(screen.getAllByText('MilMecanic').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(await screen.findByText(/correo válido/i)).toBeInTheDocument();
  });
});
