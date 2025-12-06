// services/sessions.ts
import api from './api';

export interface Session {
  id: number;
  name: string;
  book_id: number;
  user_id: number;
  current_position: number;
  total_sentences?: number;
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
  // Создание сессии
  createSession: async (bookId: number, name: string): Promise<Session> => {
    const response = await api.post('/sessions/', {
        name: name,
        book_id: bookId
    });
    return response.data;
},

  // Получение всех сессий
  getSessions: async (): Promise<Session[]> => {
    const response = await api.get('/sessions/');
    return response.data;
  },

  // Получение конкретной сессии
  getSession: async (sessionId: number): Promise<Session> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Удаление сессии
  deleteSession: async (sessionId: number): Promise<void> => {
    await api.delete(`/sessions/${sessionId}`);
  },

  // Обновление позиции - ИЗМЕНЯЕМ ПУТЬ
  updateSessionPosition: async (sessionId: number, position: number): Promise<any> => {
    const response = await api.put(`/sessions/${sessionId}/position`, null, {
      params: { position }
    });
    return response.data;
  },

  // Добавление выделения
 addHighlight: async (sessionId: number, data: CreateHighlightData): Promise<Highlight> => {
    const response = await api.post(`/sessions/${sessionId}/highlights`, data);
    return response.data;
},

  // Получение выделений сессии
  getSessionHighlights: async (sessionId: number): Promise<Highlight[]> => {
    try {
      const response = await api.get(`/sessions/${sessionId}/highlights`);
      return response.data;
    } catch (error) {
      console.warn('Highlights endpoint not implemented yet, returning empty array');
      return [];
    }
  },

  // Создание конспекта - ФИКСИМ ТИП
  createSummary: async (sessionId: number, content: string): Promise<Summary> => {
    const response = await api.post(`/sessions/${sessionId}/summarize`, {
      content: content
    });
    return response.data;
  },

  // Получение конспекта
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

