/**
 * API service module for communicating with the backend.
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// --- LiveKit Token ---
export async function getToken(roomName = 'voice-agent-room', participantName = 'user') {
  const { data } = await api.post('/livekit/token', {
    room_name: roomName,
    participant_name: participantName,
  });
  return data;
}

// --- Documents ---
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listDocuments() {
  const { data } = await api.get('/documents');
  return data;
}

export async function deleteDocument(docId) {
  const { data } = await api.delete(`/documents/${docId}`);
  return data;
}

// --- Agent Config ---
export async function getPrompt() {
  const { data } = await api.get('/agent/config');
  return data;
}

export async function updatePrompt(prompt) {
  const { data } = await api.put('/agent/config', { prompt });
  return data;
}

export async function resetPrompt() {
  const { data } = await api.post('/agent/config/reset');
  return data;
}

// --- Health ---
export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}

export default api;
