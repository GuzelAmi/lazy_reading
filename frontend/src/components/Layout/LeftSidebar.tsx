import React from 'react';
import { Upload } from 'lucide-react';
import { theme, SessionItem } from '../../types';

interface LeftSidebarProps {
  isSidebarOpen: boolean;
  activeSession: SessionItem | null;
  handleSelectSession: (session: SessionItem) => void;
  sessions: SessionItem[];
  onUploadClick: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isSidebarOpen,
  activeSession,
  handleSelectSession,
  sessions,
  onUploadClick,
}) => (
  <aside 
    className={`
      ${isSidebarOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-16 opacity-0'} 
      bg-[#FCFCFC] border-r border-[#274E7D]/10 transition-all duration-500 ease-in-out flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
    `}
  >
    {/* Заголовок */}
    <div className="p-4 pb-1">
      <h2 className={`text-xl font-bold ${theme.primaryText} flex items-center gap-2`}>
        Сессии
        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </h2>
    </div>

    {/* Список сессий */}
    <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2 custom-scrollbar">
      {sessions.map((session) => (
        <div 
          key={session.id}
          onClick={() => handleSelectSession(session)}
          className={`
            cursor-pointer p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden
            ${activeSession?.id === session.id 
              ? 'bg-[#274E7D] border-[#274E7D] text-white shadow-lg shadow-[#274E7D]/20 transform scale-[1.02]' 
              : 'bg-white border-gray-100 hover:border-[#274E7D]/30 hover:shadow-md text-gray-700'}
          `}
          style={{ height: '120px' }}
        >
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <h3 className={`text-lg font-bold leading-tight line-clamp-2 ${activeSession?.id === session.id ? 'text-white' : theme.primaryText}`}>
                {session.title}
              </h3>
              <p className={`text-xs mt-1 ${activeSession?.id === session.id ? 'text-blue-100' : 'text-gray-400'}`}>
                {session.author}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className={activeSession?.id === session.id ? 'text-blue-100' : 'text-gray-500'}>
                  Прогресс
                </span>
                <span className={activeSession?.id === session.id ? 'text-white' : theme.primaryText}>
                  {session.progress}%
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${activeSession?.id === session.id ? 'bg-black/20' : 'bg-gray-100'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${activeSession?.id === session.id ? 'bg-white' : 'bg-[#274E7D]'}`}
                  style={{ width: `${session.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Футер: Кнопка загрузки */}
    <div className="p-3 border-t border-[#274E7D]/5 bg-gray-50/50">
      <button 
        onClick={onUploadClick}
        className={`
          w-full rounded-xl border-2 border-dashed border-[#274E7D]/30 
          flex flex-col items-center justify-center gap-2 text-[#274E7D] 
          hover:bg-[#274E7D]/5 hover:border-[#274E7D] transition-all group bg-white
        `}
        style={{ height: '120px' }}
      >
        <div className="p-3 bg-[#274E7D]/10 rounded-full group-hover:scale-110 transition-transform duration-300">
          <Upload size={24} />
        </div>
        <span className="font-bold text-sm">Загрузить книгу</span>
      </button>
    </div>
  </aside>
);