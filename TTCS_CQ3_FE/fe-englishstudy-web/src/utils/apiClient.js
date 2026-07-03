import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const DEFAULT_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function refreshAuth() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(buildUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: {
      'Refresh-Token': refreshToken
    }
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!data) return null;

  
  const nextAccessToken = data.accessToken ?? data.access_token ?? data.token ?? data.jwt;
  const nextRefreshToken = data.refreshToken ?? data.refresh_token ?? refreshToken;

  setTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken });
  return { accessToken: nextAccessToken, refreshToken: nextRefreshToken, raw: data };
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    query,
    auth = true,
    retryOn401 = true
  } = options;

  const finalHeaders = { ...headers };
  let finalBody = body;

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'application/json';
    finalBody = JSON.stringify(body);
  }

  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: finalHeaders,
    body: finalBody
  });

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await refreshAuth();
    if (refreshed?.accessToken) {
      return apiRequest(path, { ...options, retryOn401: false });
    } else {
      
      clearTokens();
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
  }

  
  

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    const err = new Error(errorText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = errorText;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}
