import { apiRequest } from '../apiClient';

export async function fetchVocabularyById(id) {
  return apiRequest(`/api/vocabularies/${id}`, { method: 'GET', auth: true });
}

export async function fetchUserVocabularies() {
  return apiRequest('/api/vocabularies/user', { method: 'GET', auth: true });
}

export async function createVocabulary(payload) {
  return apiRequest('/api/vocabularies', { method: 'POST', auth: true, body: payload });
}

export async function updateVocabulary(id, payload) {
  return apiRequest(`/api/vocabularies/${id}`, { method: 'PUT', auth: true, body: payload });
}

export async function deleteVocabulary(id) {
  return apiRequest(`/api/vocabularies/${id}`, { method: 'DELETE', auth: true });
}

export async function importVocabulariesCsv(file) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/vocabularies/import', {
    method: 'POST',
    auth: true,
    body: form,
  });
}

export async function adminImportVocabulariesCsv(file, { topicId, lessonId } = {}) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/admin/vocabularies/import', {
    method: 'POST',
    auth: true,
    body: form,
    query: { topicId, lessonId }
  });
}

export async function downloadVocabImportTemplate() {
  const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
  const res = await fetch(`${API_BASE_URL}/api/templates/vocab-import.csv`, { method: 'GET' });
  if (!res.ok) throw new Error('Template download failed');
  return res.blob();
}
