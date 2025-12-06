// App.tsx - исправляем типы и функции
import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/Auth/AuthScreen';
import { Header } from './components/Layout/Header';
import { LeftSidebar } from './components/Layout/LeftSidebar';
import { RightSidebar } from './components/Layout/RightSidebar';
import { HomeView } from './components/Views/HomeView';
import { SessionView } from './components/Views/SessionView';
import { ViewState, TabState, SessionItem, Book } from './types';
import { authService } from './services/auth';
import { booksService } from './services/books';
import { sessionsService } from './services/sessions';

const App = () => {
  // --- Состояние ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Состояние макета
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabState>('BOOK');
  
  // Данные с API
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      loadUserData();
    }
  }, []);

  // Загрузка данных пользователя
  const loadUserData = async () => {
  try {
    setLoading(true);
    
    // Загружаем книги
    const userBooks = await booksService.getBooks();
    setBooks(userBooks);
    
    // Загружаем сессии
    const userSessions = await sessionsService.getSessions();
    
    // Создаем SessionItem для отображения в сайдбаре
    const sessionItems: SessionItem[] = await Promise.all(
      userSessions.map(async (session) => {
        // Находим книгу для названия и автора
        const book = userBooks.find(b => b.id === session.book_id);
        
        // Получаем детали сессии (чтобы получить current_position)
        const sessionDetails = await sessionsService.getSession(session.id);
        
        // Временный расчет прогресса
        const progress = sessionDetails.current_position > 0 ? Math.min(sessionDetails.current_position * 5, 100) : 0;
        
        return {
          id: session.id,
          title: book?.title || session.name,
          author: book?.author || 'Автор неизвестен',
          progress: progress,
          book_id: session.book_id,
          session_id: session.id,
          current_position: sessionDetails.current_position || 0,
          total_sentences: session.total_sentences || 100, // Временное значение
        };
      })
    );
    
    setSessions(sessionItems);
  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    setLoading(false);
  }
};

  // Функция для обновления прогресса
  const handleUpdateProgress = (
    sessionId: number, 
    currentPosition: number, 
    totalSentences: number
  ) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            current_position: currentPosition,
            total_sentences: totalSentences,
            progress: totalSentences > 0 ? Math.round((currentPosition / totalSentences) * 100) : 0
          } 
        : session
    ));
    
    // Обновляем активную сессию
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(prev => prev ? {
        ...prev,
        current_position: currentPosition,
        total_sentences: totalSentences,
        progress: totalSentences > 0 ? Math.round((currentPosition / totalSentences) * 100) : 0
      } : null);
    }
  };

  // --- Обработчики ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        await authService.register({ username, password });
      }
      
      const authResponse = await authService.login({ username, password });
      
      localStorage.setItem('token', authResponse.access_token);
      localStorage.setItem('user_id', authResponse.user_id.toString());
      localStorage.setItem('username', username);
      
      setIsLoggedIn(true);
      await loadUserData();
      
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (session: SessionItem) => {
    setActiveSession(session);
    setCurrentView('SESSION');
    setActiveTab('BOOK');
    setIsRightSidebarOpen(true);
  };

  const handleHomeClick = () => {
    setCurrentView('HOME');
    setActiveSession(null);
    setIsRightSidebarOpen(false);
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload')?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем расширение файла
    if (!file.name.toLowerCase().endsWith('.txt')) {
      alert('Пожалуйста, загружайте только файлы в формате TXT');
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      
      // Извлекаем название книги из имени файла
      // Убираем расширение .txt и другие расширения
      let title = file.name
        .replace(/\.[^/.]+$/, "") // Убираем расширение
        .replace(/_/g, ' ') // Заменяем подчеркивания на пробелы
        .replace(/-/g, ' ') // Заменяем дефисы на пробелы
        .trim();
      
      // Если имя файла пустое, используем "Без названия"
      if (!title) {
        title = "Без названия";
      }
      
      // Пытаемся извлечь автора из имени файла (если формат "Автор - Название.txt" или подобный)
      let author = '';
      const authorPatterns = [
        /^(.*?)[_\-–—\s]+[–—\s]+(.*)$/, // Автор — Название
        /^(.*?)\s*-\s*(.*)$/, // Автор - Название
        /^(.*?)\s*–\s*(.*)$/, // Автор – Название
      ];
      
      for (const pattern of authorPatterns) {
        const match = title.match(pattern);
        if (match && match[1] && match[2]) {
          author = match[1].trim();
          title = match[2].trim();
          break;
        }
      }
      
      // Загружаем книгу
      const book = await booksService.uploadBook({
        title: title,
        author: author || undefined,
        file: file
      });
      
      // Создаем сессию для этой книги
      const session = await sessionsService.createSession(book.id, `Чтение: ${title}`);
      
      // Обновляем данные
      await loadUserData();
      
      // Находим новую сессию
      const sessionItem: SessionItem = {
        id: session.id,
        title: title,
        author: author || 'Автор неизвестен',
        progress: 0,
        book_id: book.id,
        session_id: session.id,
        current_position: 0,
        total_sentences: 100, // Временное значение
      };
      
      setActiveSession(sessionItem);
      setCurrentView('SESSION');
      setActiveTab('BOOK');
      setIsRightSidebarOpen(true);
      
      // Уведомляем пользователя
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span>Книга "${title}" успешно загружена!</span>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Автоматически скрываем уведомление через 3 секунды
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
    } catch (error: any) {
      console.error('Ошибка загрузки книги:', error);
      
      // Показываем ошибку
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <span>Ошибка: ${error.response?.data?.detail || 'Не удалось загрузить книгу'}</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await sessionsService.deleteSession(sessionId);
      
      // Удаляем сессию из состояния
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // Если удаляем активную сессию, сбрасываем состояние
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null);
        setCurrentView('HOME');
      }
      
      alert('Сессия успешно удалена!');
      
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Ошибка при удалении сессии');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setSessions([]);
    setBooks([]);
    setActiveSession(null);
  };

  const handleCreateSummary = async () => {
    if (!activeSession) return;
    
    try {
      // Исправляем: передаем строку, а не объект
      await sessionsService.createSummary(activeSession.id, "Генерируется...");
      
      alert('Конспект начал создаваться!');
      
    } catch (error) {
      console.error('Error creating summary:', error);
    }
  };

  // --- Экран авторизации ---
  if (!isLoggedIn) {
    return (
      <AuthScreen 
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        handleLogin={handleLogin}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#274E7D] mx-auto mb-4"></div>
          <p className="text-[#274E7D]">Загрузка...</p>
        </div>
      </div>
    );
  }

  // --- Основной макет приложения ---
  return (
    <div className={`h-screen flex flex-col bg-[#F5F5F0] text-gray-800 font-serif overflow-hidden`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        body, .font-serif { font-family: 'Lora', serif !important; }
      `}</style>
      
      {/* --- Header --- */}
      <Header
        username={username}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isRightSidebarOpen={isRightSidebarOpen}
        setIsRightSidebarOpen={setIsRightSidebarOpen}
        handleHomeClick={handleHomeClick}
        setIsLoggedIn={handleLogout}
        currentView={currentView}
      />

      {/* --- Content Body --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- LeftSidebar (Список сессий) --- */}
        <LeftSidebar 
          isSidebarOpen={isSidebarOpen}
          activeSession={activeSession}
          handleSelectSession={handleSelectSession}
          sessions={sessions}
          onUploadClick={handleUploadClick}
          onDeleteSession={handleDeleteSession}
        />

        {/* --- Main Center View --- */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#F5F5F0] transition-all duration-300">
          
          {/* Home View */}
          <div className={`
            absolute inset-0 flex flex-col h-full transition-opacity duration-500
            ${currentView === 'HOME' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}
          `}>
            <HomeView onUploadClick={handleUploadClick} />
          </div>

          {/* Session View */}
          <div className={`
            absolute inset-0 flex flex-col h-full transition-opacity duration-500
            ${currentView === 'SESSION' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}
          `}>
            {activeSession ? (
              <SessionView 
                activeSession={activeSession}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isRightSidebarOpen={isRightSidebarOpen}
                setIsRightSidebarOpen={setIsRightSidebarOpen}
                onUpdateProgress={handleUpdateProgress}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">Выберите сессию для начала чтения</p>
              </div>
            )}
          </div>
        </main>

        {/* --- RightSidebar (Конспект) --- */}
        <RightSidebar 
          isOpen={isRightSidebarOpen}
          onCreateSummary={handleCreateSummary}
        />
      </div>

      {/* Скрытый input для загрузки файла */}
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept=".txt" 
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default App;