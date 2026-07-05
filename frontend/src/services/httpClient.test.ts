import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getAccessToken, request, setTokens } from './httpClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('httpClient', () => {
  beforeEach(() => {
    setTokens(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches the Authorization header when tokens are set', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await request('/organizations');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options?.headers as Record<string, string>).Authorization).toBe('Bearer access-1');
    expect(getAccessToken()).toBe('access-1');
  });

  it('normalizes validation errors (message as array) into ApiError.messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(400, { statusCode: 400, message: ['email must be an email'], error: 'Bad Request' }),
    );

    await expect(request('/auth/register', { method: 'POST', skipAuth: true })).rejects.toMatchObject({
      status: 400,
      messages: ['email must be an email'],
    });
  });

  it('normalizes business errors (message as a single string) into ApiError.messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(409, { statusCode: 409, message: 'E-mail já cadastrado', error: 'Conflict' }),
    );

    await expect(request('/auth/register', { method: 'POST', skipAuth: true })).rejects.toMatchObject({
      status: 409,
      messages: ['E-mail já cadastrado'],
    });
  });

  it('retries the original request once after a successful token refresh on 401', async () => {
    setTokens({ accessToken: 'expired', refreshToken: 'refresh-1' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'fresh' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'org-1' }));

    const result = await request('/organizations');

    expect(result).toEqual({ id: 'org-1' });
    expect(getAccessToken()).toBe('fresh');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('clears the session and dispatches auth:logout when refresh also fails', async () => {
    setTokens({ accessToken: 'expired', refreshToken: 'invalid' });
    const listener = vi.fn();
    window.addEventListener('auth:logout', listener);

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Refresh token inválido ou expirado' }));

    await expect(request('/organizations')).rejects.toBeInstanceOf(ApiError);

    expect(getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:logout', listener);
  });
});
