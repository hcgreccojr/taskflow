import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthForm } from './AuthForm';
import { ApiError } from '../../../services/httpClient';

const login = vi.fn();
const register = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (state: { login: typeof login; register: typeof register }) => unknown) =>
    selector({ login, register }),
}));

describe('AuthForm', () => {
  beforeEach(() => {
    login.mockReset();
    register.mockReset();
  });

  it('shows the Nome field only on the Cadastro tab', () => {
    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
  });

  it('submits login with the entered credentials', async () => {
    login.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('ana@example.com', 'senha1234'));
  });

  it('shows the API error message when login fails', async () => {
    login.mockRejectedValue(new ApiError(401, ['Credenciais inválidas']));
    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaerrada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument();
  });
});
