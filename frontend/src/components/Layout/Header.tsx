import React from 'react';
import { Menu, LogOut, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { theme } from '../../types';

interface HeaderProps {
  username: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (b: boolean) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (b: boolean) => void;
  handleHomeClick: () => void;
  setIsLoggedIn: (b: boolean) => void;
  currentView?: 'HOME' | 'SESSION'; // Добавляем текущий вид
}

export const Header: React.FC<HeaderProps> = ({
  username,
  isSidebarOpen,
  setIsSidebarOpen,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  handleHomeClick,
  setIsLoggedIn,
  currentView = 'HOME', // Значение по умолчанию
}) => (
  <header className={`h-16 bg-white border-b border-[#274E7D]/10 flex items-center justify-between px-4 shadow-sm z-30 relative`}>
    <div className="flex items-center gap-4">
      {/* Кнопка левого сайдбара */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`p-2 rounded-lg hover:bg-[#274E7D]/5 ${theme.primaryText} transition-colors`}
        title={isSidebarOpen ? "Свернуть левую панель" : "Развернуть левую панель"}
      >
        {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
      </button>
      <div className="h-6 w-px bg-gray-200"></div>
      
      {/* Логотип */}
      <h1 
        onClick={handleHomeClick}
        className={`text-2xl font-bold ${theme.primaryText} cursor-pointer select-none tracking-tight hover:opacity-80 transition-opacity`}
      >
        lazy reading
      </h1>
    </div>

    <div className="flex items-center gap-6">
      {/* Показываем кнопку правого сайдбара только когда находимся на странице сессии */}
      {currentView === 'SESSION' && (
        <>
          <div className="h-6 w-px bg-gray-200"></div>
          <button 
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`p-2 rounded-lg hover:bg-[#274E7D]/5 ${theme.primaryText} transition-colors flex items-center gap-2`}
            title={isRightSidebarOpen ? "Скрыть конспект" : "Показать конспект"}
          >
            <BookOpen size={20} />
            <span className="text-sm font-medium">Конспект</span>
            {isRightSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </>
      )}
      
      {/* Информация о пользователе */}
      <div className="flex flex-col items-end">
        <span className={`text-sm font-bold ${theme.primaryText}`}>{username}</span>
        <span className="text-xs text-gray-400">Читатель</span>
      </div>
      
      {/* Кнопка выхода */}
      <button 
        onClick={() => setIsLoggedIn(false)}
        className="flex items-center gap-2 text-gray-400 hover:text-[#274E7D] transition-colors group px-3 py-1.5 rounded-md hover:bg-[#274E7D]/5"
      >
        <span className="text-sm font-medium">Выйти</span>
        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </header>
);