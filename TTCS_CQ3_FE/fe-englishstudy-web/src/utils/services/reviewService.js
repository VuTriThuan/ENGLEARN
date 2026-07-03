import { apiRequest } from '../apiClient';

export async function getSmartReview(userId, limit = 20) {
  return apiRequest(`/api/review/smart?userId=${userId}&limit=${limit}`, { 
    method: 'GET', 
    auth: true 
  });
}

export async function getSmartReviewDebug(userId, limit = 20) {
  return apiRequest(`/api/review/smart-debug?userId=${userId}&limit=${limit}`, { 
    method: 'GET', 
    auth: true 
  });
}

export async function resetPForget(vocabId) {
  return apiRequest(`/api/review/${vocabId}/p-forget/reset`, {
    method: 'PATCH',
    auth: true
  });
}