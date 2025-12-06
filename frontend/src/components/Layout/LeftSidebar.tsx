import React from 'react';
import { Upload, Trash2, Clock, Book } from 'lucide-react';
import { SessionItem } from '../../types';

interface LeftSidebarProps {
  isSidebarOpen: boolean;
  activeSession: SessionItem | null;
  handleSelectSession: (session: SessionItem) => void;
  sessions: SessionItem[];
  onUploadClick: () => void;
  onDeleteSession: (sessionId: number) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isSidebarOpen,
  activeSession,
  handleSelectSession,
  sessions,
  onUploadClick,
  onDeleteSession,
}) => (
  <aside 
    className={`
      ${isSidebarOpen ? 'w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-16 opacity-0'} 
      bg-white border-r border-gray-100 transition-all duration-500 ease-in-out 
      flex flex-col flex-shrink-0 z-20 shadow-sm
    `}
  >
    {/* Заголовок */}
    <div className="p-6 pb-4">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Book size={20} className="text-[#274E7D]" />
        Мои сессии
        <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </h2>
      <p className="text-xs text-gray-400 mt-1">Нажмите на сессию, чтобы продолжить чтение</p>
    </div>

    {/* Список сессий */}
    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
      {sessions.map((session) => (
        <div 
          key={session.id}
          className="group relative"
        >
          {/* Основная карточка */}
          <div 
            onClick={() => handleSelectSession(session)}
            className={`
              relative p-4 rounded-lg border cursor-pointer transition-all duration-200
              ${activeSession?.id === session.id 
                ? 'bg-gradient-to-r from-[#274E7D] to-[#1f3d61] border-[#274E7D] text-white shadow-md' 
                : 'bg-white border-gray-200 hover:border-[#274E7D]/40 hover:shadow-sm'}
            `}
          >
            {/* Кнопка удаления - появляется справа */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Удалить сессию "${session.title}"?`)) {
                  onDeleteSession(session.session_id);
                }
              }}
              className={`
                absolute -top-2 -right-2 p-1.5 rounded-full bg-white border 
                shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200
                hover:bg-red-50 hover:border-red-200 hover:text-red-500
                ${activeSession?.id === session.id 
                  ? 'border-gray-300 text-gray-500' 
                  : 'border-gray-200 text-gray-400'}
              `}
              title="Удалить сессию"
            >
              <Trash2 size={14} />
            </button>

            {/* Контент карточки */}
            <div className="pr-4"> {/* Отступ справа для кнопки удаления */}
              {/* Заголовок */}
              <h3 className={`
                font-bold text-sm leading-tight mb-1 line-clamp-2
                ${activeSession?.id === session.id ? 'text-white' : 'text-gray-800'}
              `}>
                {session.title}
              </h3>
              
              {/* Автор */}
              <p className={`
                text-xs mb-3 flex items-center gap-1
                ${activeSession?.id === session.id ? 'text-blue-100' : 'text-gray-500'}
              `}>
                <Clock size={10} />
                {session.author || 'Автор неизвестен'}
              </p>

              {/* Прогресс */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className={activeSession?.id === session.id ? 'text-blue-100' : 'text-gray-500'}>
                    Прогресс
                  </span>
                  <span className={`
                    font-bold ${activeSession?.id === session.id ? 'text-white' : 'text-[#274E7D]'}
                  `}>
                    {session.progress}%
                  </span>
                </div>
                
                {/* Прогресс-бар */}
                <div className={`
                  h-1.5 rounded-full overflow-hidden
                  ${activeSession?.id === session.id ? 'bg-white/20' : 'bg-gray-100'}
                `}>
                  <div 
                    className={`
                      h-full rounded-full transition-all duration-1000 ease-out
                      ${activeSession?.id === session.id 
                        ? 'bg-gradient-to-r from-white to-blue-100' 
                        : 'bg-gradient-to-r from-[#274E7D] to-[#3a6ba5]'}
                    `}
                    style={{ width: `${Math.min(session.progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {sessions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Book size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Нет созданных сессий</p>
          <p className="text-xs mt-1">Загрузите книгу, чтобы начать</p>
        </div>
      )}
    </div>

    {/* Кнопка загрузки */}
    <div className="p-6 pt-4 border-t border-gray-100">
      <button 
        onClick={onUploadClick}
        className="
          w-full rounded-lg border-2 border-dashed border-gray-300 
          flex flex-col items-center justify-center gap-3 text-gray-600 
          hover:border-[#274E7D] hover:text-[#274E7D] hover:bg-blue-50/50 
          transition-all duration-200 group bg-white py-6
        "
      >
        <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
          <Upload size={20} className="text-[#274E7D]" />
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-sm">Загрузить новую книгу</span>
          <p className="text-xs text-gray-400">Поддерживаются TXT файлы</p>
        </div>
      </button>
    </div>
  </aside>
);