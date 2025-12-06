// services/books.ts
import api from './api';

export interface Book {
  id: number;
  title: string;
  author: string | null;
  owner_id: number;
}

export interface UploadBookData {
  title: string;
  author?: string;
  file: File;
}

export const booksService = {
  getBooks: async (): Promise<Book[]> => {
    const response = await api.get('/books/');
    return response.data;
  },

  uploadBook: async (data: UploadBookData): Promise<Book> => {
    const formData = new FormData();
    formData.append('book_file', data.file);
    formData.append('title', data.title);
    if (data.author) {
      formData.append('author', data.author);
    }

    const response = await api.post('/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getBookText: async (bookId: number): Promise<string> => {
    const response = await api.get(`/books/${bookId}/text`);
    return response.data;
  },
};