import { apiRequest } from '../apiClient';

export async function fetchLessons() {
  return apiRequest('/api/lessons', { method: 'GET', auth: true });
}

export async function fetchLessonById(id) {
  return apiRequest(`/api/lessons/${id}`, { method: 'GET', auth: true });
}

export async function createLesson(payload) {
  return apiRequest('/api/lessons', { method: 'POST', auth: true, body: payload });
}

export async function updateLesson(id, payload) {
  return apiRequest(`/api/lessons/${id}`, { method: 'PUT', auth: true, body: payload });
}

export async function deleteLesson(id) {
  return apiRequest(`/api/lessons/${id}`, { method: 'DELETE', auth: true });
}

export async function fetchLessonVocabularies(id) {
  return apiRequest(`/api/lessons/${id}/vocabularies`, { method: 'GET', auth: true });
}
