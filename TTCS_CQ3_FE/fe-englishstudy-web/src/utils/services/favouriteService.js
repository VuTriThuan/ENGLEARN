import { apiRequest } from '../apiClient';

export async function fetchFavorites() {
  return apiRequest('/api/favourites', { method: 'GET', auth: true });
}

export async function addFavorite(vocabId) {
  return apiRequest(`/api/favourites/${vocabId}`, { method: 'POST', auth: true });
}

export async function removeFavorite(vocabId) {
  return apiRequest(`/api/favourites/${vocabId}`, { method: 'DELETE', auth: true });
}

export async function checkFavorite(vocabId) {
  return apiRequest(`/api/favourites/${vocabId}/check`, { method: 'GET', auth: true });
}