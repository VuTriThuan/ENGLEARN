import { apiRequest } from '../apiClient';

export async function initGame(gameType, payload) {
  return apiRequest(`/api/practice/${gameType}/init`, {
    method: 'POST',
    auth: true,
    body: payload
  });
}

export async function finishGame(gameType, payload) {
  return apiRequest(`/api/practice/${gameType}/finish`, {
    method: 'POST',
    auth: true,
    body: payload
  });
}
