import { apiRequest } from '../apiClient';


export async function fetchCollections() {
  return apiRequest('/api/collections', { method: 'GET', auth: true });
}


export async function createCollection(name) {
  return apiRequest('/api/collections', {
    method: 'POST',
    auth: true,
    body: { collectionName: name }
  });
}


export async function deleteCollection(collectionId) {
  return apiRequest(`/api/collections/${collectionId}`, {
    method: 'DELETE',
    auth: true
  });
}


export async function fetchCollectionVocabs(collectionId) {
  return apiRequest(`/api/collections/${collectionId}/vocabs`, {
    method: 'GET',
    auth: true
  });
}


export async function addVocabToCollection(collectionId, vocabId) {
  return apiRequest(`/api/collections/${collectionId}/vocabs/${vocabId}`, {
    method: 'POST',
    auth: true
  });
}

export async function updateCollectionName(collectionId, newName) {
  return apiRequest(`/api/collections/${collectionId}`, {
    method: 'PUT',
    auth: true,
    body: { name: newName }
  });
}


export async function removeVocabFromCollection(collectionId, vocabId) {
  return apiRequest(`/api/collections/${collectionId}/vocabs/${vocabId}`, {
    method: 'DELETE',
    auth: true
  });
}