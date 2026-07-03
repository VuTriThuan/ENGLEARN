import { apiRequest } from '../apiClient';
import { setTokens, clearTokens } from '../tokenStorage';

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password }
  });

  const accessToken = data?.accessToken ?? data?.access_token ?? data?.token ?? data?.jwt;
  const refreshToken = data?.refreshToken ?? data?.refresh_token;
  setTokens({ accessToken, refreshToken });

  return data;
}

export async function register(payload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: payload
  });
}

export async function getMe() {
  return apiRequest('/api/auth/me', { method: 'GET', auth: true });
}

export function logout() {
  clearTokens();
}
