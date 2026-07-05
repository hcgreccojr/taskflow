const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages.join(' '));
  }
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

let tokens: Tokens | null = null;

/** Sincronizado pela authStore no login/registro/logout/bootstrap. */
export function setTokens(next: Tokens | null): void {
  tokens = next;
}

export function getAccessToken(): string | null {
  return tokens?.accessToken ?? null;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
  /** Rotas de auth não devem tentar refresh em 401 nem reenviar Authorization. */
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

async function parseErrorMessages(response: Response): Promise<string[]> {
  try {
    const body = await response.json();
    if (Array.isArray(body?.message)) {
      return body.message;
    }
    if (typeof body?.message === 'string') {
      return [body.message];
    }
    return [response.statusText];
  } catch {
    return [response.statusText];
  }
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!options.skipAuth && tokens) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessages(response));
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!tokens) return false;
  if (!refreshPromise) {
    refreshPromise = rawRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: tokens.refreshToken },
      skipAuth: true,
    })
      .then((result) => {
        if (tokens) {
          tokens = { accessToken: result.accessToken, refreshToken: tokens.refreshToken };
        }
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !options.skipAuth && tokens) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return rawRequest<T>(path, options);
      }
      tokens = null;
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    throw error;
  }
}
