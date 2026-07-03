import { apiRequest } from '../apiClient';

export async function fetchAllUsers() {
  return apiRequest('/api/admin/users', { method: 'GET', auth: true });
}

export async function fetchUserById(id) {
  return apiRequest(`/api/admin/users/${id}`, { method: 'GET', auth: true });
}

export async function deleteUserById(id) {
  return apiRequest(`/api/admin/users/${id}`, { method: 'DELETE', auth: true });
}
