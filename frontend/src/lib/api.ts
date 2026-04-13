const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, '')
  : '';

export function buildApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured for frontend build');
  }

  return `${API_BASE_URL}${path}`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function fetchWithAuth(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(buildApiUrl(path), {
    ...init,
    headers,
  });
}
