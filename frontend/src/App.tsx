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
          const book = userBooks.find(b => b.id === session.book_id);
          
          // Загружаем выделения для расчета прогресса
          const highlights = await sessionsService.getSessionHighlights(session.id);
          const sessionHighlights = highlights || [];
          
          // Рассчитываем прогресс на основе выделенных предложений
          // Для расчета нужен общий текст книги, пока используем приблизительный расчет
          const progress = Math.min(sessionHighlights.length * 10, 100); // Временная формула
          
          return {
            id: session.id,
            title: book?.title || session.name,
            author: book?.author || 'Автор неизвестен',
            progress: progress,
            book_id: session.book_id,
            session_id: session.id,
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




  const handleCreateSummary = async () => {
    if (!activeSession) return;
    
    try {
      // Вызываем API для создания конспекта
      await sessionsService.createSummary(activeSession.session_id, {
        content: "Генерируется..."
      });
      
      // Обновляем конспект
      const newSummary = await sessionsService.getSessionSummary(activeSession.session_id);
      // Обновляем состояние...
      
    } catch (error) {
      console.error('Error creating summary:', error);
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

    // Предлагаем название книги из имени файла
    const defaultTitle = file.name.replace(/\.[^/.]+$/, ""); // Убираем расширение
    
    const userTitle = prompt('Введите название книги:', defaultTitle);
    if (!userTitle) {
      e.target.value = '';
      return;
    }
    
    const userAuthor = prompt('Введите автора книги (необязательно):', '');

    try {
      setLoading(true);
      
      // Загружаем книгу (автоматически создаст сессию)
      const response = await booksService.uploadBook({
        title: userTitle,
        author: userAuthor || undefined,
        file: file
      });
      
      // Обновляем данные
      await loadUserData();
      
      // Находим новую сессию и переходим к ней
      const newSessionItem = {
        id: response.session_id,
        title: userTitle,
        author: userAuthor || 'Автор неизвестен',
        progress: 0,
        book_id: response.id,
        session_id: response.session_id,
      };
      
      setActiveSession(newSessionItem);
      setCurrentView('SESSION');
      setActiveTab('BOOK');
      setIsRightSidebarOpen(true);
      
      alert('Книга успешно загружена и сессия создана!');
      
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Ошибка загрузки книги');
    } finally {
      setLoading(false);
      e.target.value = '';
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
        currentView={currentView} // Передаем текущий вид
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