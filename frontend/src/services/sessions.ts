// services/sessions.ts
import api from './api';

export interface Session {
  id: number;
  name: string;
  book_id: number;
  user_id: number;
  current_position: number; // Добавляем это поле
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
    const response = await api.post(`/sessions/${sessionId}/highlights`, {
      sentence_index: data.sentence_index,
      text: data.text
    });
    return response.data;
  },

  createSummary: async (sessionId: number, data: CreateSummaryData): Promise<Summary> => {
    const response = await api.post(`/sessions/${sessionId}/summarize`, data);
    return response.data;
  },

  // Добавляем новые методы
  updateSessionPosition: async (sessionId: number, position: number): Promise<Session> => {
    const response = await api.put(`/sessions/${sessionId}/position/quick`, {
      position: position
    });
    return response.data;
  },

  deleteSession: async (sessionId: number): Promise<{message: string, session_id: number}> => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  getSessionHighlights: async (sessionId: number): Promise<Highlight[]> => {
    try {
      const response = await api.get(`/sessions/${sessionId}/highlights`);
      return response.data;
    } catch (error) {
      console.warn('Highlights endpoint not implemented yet, returning empty array');
      return [];
    }
  },

  getSessionSummary: async (sessionId: number): Promise<Summary | null> => {
    try {
      const response = await api.get(`/sessions/${sessionId}/summary`);
      return response.data;
    } catch (error) {
      console.warn('Summary endpoint not implemented yet, returning null');
      return null;
    }
  },
};