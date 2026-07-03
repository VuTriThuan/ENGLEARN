import { apiRequest } from "../apiClient";

export async function updateMyProfile(payload) {
  return apiRequest("/api/user/me/update-profile", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/api/user/me/avatar", {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export async function changeMyPassword(payload) {
  return apiRequest("/api/user/me/change-password", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function saveVocabProgress(payload) {
  return apiRequest("/api/user/me/vocab-progress", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function fetchVocabReview() {
  return apiRequest("/api/user/me/vocab-review", {
    method: "GET",
    auth: true,
  });
}