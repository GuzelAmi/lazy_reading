import api from './api';

export interface Session {
  id: number;
  name: string;
  book_id: number;
  user_id: number;
}

export interface CreateSessionData {
  name: string;
  book_id: number;
}

export interface Highlight {
  id: number;
  session_id: number;
  sentence_index: number;
  text: string;
}

export interface CreateHighlightData {
  sentence_index: number;
  text: string;
}

export interface Summary {
  id: number;
  session_id: number;
  content: string;
}

export interface CreateSummaryData {
  content: string;
}

export const sessionsService = {
  createSession: async (data: CreateSessionData): Promise<Session> => {
    const response = await api.post('/sessions/', data);
    return response.data;
  },

  getSessions: async (): Promise<Session[]> => {
    const response = await api.get('/sessions/');
    return response.data;
  },

  getSession: async (sessionId: number): Promise<Session> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  addHighlight: async (sessionId: number, data: CreateHighlightData): Promise<Highlight> => {
    const response = await api.post(`/sessions/${sessionId}/highlights`, data);
    return response.data;
  },

  createSummary: async (sessionId: number, data: CreateSummaryData): Promise<Summary> => {
    const response = await api.post(`/sessions/${sessionId}/summarize`, data);
    return response.data;
  },

  // Временные методы (нужно добавить на бэкенде)
  getSessionHighlights: async (sessionId: number): Promise<Highlight[]> => {
    // TODO: Добавить эндпоинт на бэкенде
    return [];
  },

  getSessionSummary: async (sessionId: number): Promise<Summary | null> => {
    // TODO: Добавить эндпоинт на бэкенде
    return null;
  },
};