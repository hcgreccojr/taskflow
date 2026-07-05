import { request } from './httpClient';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export function register(data: { name: string; email: string; password: string }): Promise<{
  id: string;
  name: string;
  email: string;
  createdAt: string;
}> {
  return request('/auth/register', { method: 'POST', body: data, skipAuth: true });
}

export function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return request('/auth/login', { method: 'POST', body: data, skipAuth: true });
}
