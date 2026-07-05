import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';
import * as authApi from '../../../services/authApi';
import * as usersApi from '../../../services/usersApi';

vi.mock('../../../services/authApi');
vi.mock('../../../services/usersApi');

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, status: 'idle' });
    vi.resetAllMocks();
  });

  it('login stores tokens and fetches the current user profile', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
    vi.mocked(usersApi.getMe).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: new Date().toISOString(),
    });

    await useAuthStore.getState().login('ana@example.com', 'senha1234');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('a1');
    expect(state.user?.name).toBe('Ana');
    expect(state.status).toBe('ready');
  });

  it('register creates the account and then logs in', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      id: 'user-1',
      name: 'Bruno',
      email: 'bruno@example.com',
      createdAt: new Date().toISOString(),
    });
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
    vi.mocked(usersApi.getMe).mockResolvedValue({
      id: 'user-1',
      name: 'Bruno',
      email: 'bruno@example.com',
      createdAt: new Date().toISOString(),
    });

    await useAuthStore.getState().register('Bruno', 'bruno@example.com', 'senha1234');

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Bruno',
      email: 'bruno@example.com',
      password: 'senha1234',
    });
    expect(authApi.login).toHaveBeenCalledWith({ email: 'bruno@example.com', password: 'senha1234' });
    expect(useAuthStore.getState().user?.name).toBe('Bruno');
  });

  it('logout clears the session', async () => {
    useAuthStore.setState({
      accessToken: 'a1',
      refreshToken: 'r1',
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.com', createdAt: new Date().toISOString() },
      status: 'ready',
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('bootstrap marks the session ready without calling the API when there are no persisted tokens', async () => {
    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().status).toBe('ready');
    expect(usersApi.getMe).not.toHaveBeenCalled();
  });

  it('bootstrap clears the session when the persisted token is no longer valid', async () => {
    useAuthStore.setState({ accessToken: 'stale', refreshToken: 'stale', status: 'idle' });
    vi.mocked(usersApi.getMe).mockRejectedValue(new Error('401'));

    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.status).toBe('ready');
    expect(state.accessToken).toBeNull();
  });
});
