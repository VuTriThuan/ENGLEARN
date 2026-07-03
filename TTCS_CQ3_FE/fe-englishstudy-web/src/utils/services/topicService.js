import { apiRequest } from '../apiClient';

export async function fetchTopics() {
  return apiRequest('/api/topics', { method: 'GET', auth: true });
}

export async function fetchTopicById(id) {
  return apiRequest(`/api/topics/${id}`, { method: 'GET', auth: true });
}

export async function createTopic(payload) {
  return apiRequest('/api/topics', { method: 'POST', auth: true, body: payload });
}

export async function updateTopic(id, payload) {
  return apiRequest(`/api/topics/${id}`, { method: 'PUT', auth: true, body: payload });
}

export async function deleteTopic(id) {
  return apiRequest(`/api/topics/${id}`, { method: 'DELETE', auth: true });
}

export async function fetchTopicVocabularies(id) {
  return apiRequest(`/api/topics/${id}/vocabularies`, { method: 'GET', auth: true });
}

export async function importTopicVocabularies(id, file) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest(`/api/topics/${id}/vocabularies/import`, { method: 'POST', auth: true, body: form });
}


export async function uploadTopicImage(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/topics/${id}/image`, {
    method: 'POST',
    auth: true,
    body: formData,
  });
}