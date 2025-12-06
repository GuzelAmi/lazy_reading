export { authService } from './auth';
export { booksService } from './books';
export { sessionsService } from './sessions';
export { default as api } from './api';
export type ViewState = 'HOME' | 'SESSION';
export type TabState = 'BOOK' | 'SUMMARY';

// Основные интерфейсы для API
export interface Book {
  id: number;
  title: string;
  author: string | null;
  owner_id: number;
  session_id?: number;
}

export interface Session {
  id: number;
  name: string;
  book_id: number;
  user_id: number;
  current_position: number; // Добавляем это поле
  book?: Book;
}

export interface Highlight {
  id: number;
  session_id: number;
  sentence_index: number;
  text: string;
}

export interface Summary {
  id: number;
  session_id: number;
  content: string;
}

// Интерфейс для отображения сессии в UI
export interface SessionItem {
  id: number;
  title: string;
  author: string;
  progress: number;
  book_id: number;
  session_id: number;
}

export const theme = {
  primary: 'bg-[#274E7D]',
  primaryText: 'text-[#274E7D]',
  primaryBorder: 'border-[#274E7D]',
  softBg: 'bg-[#F5F5F0]',
  white: 'bg-white',
  hover: 'hover:bg-[#274E7D]/10',
} as const;