import React from 'react';
import { Sparkles } from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onCreateSummary: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onCreateSummary
}) => {
  return (
    <aside 
      className={`
        ${isOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 translate-x-16 opacity-0'} 
        bg-white border-l border-[#274E7D]/10 transition-all duration-500 ease-in-out flex flex-col flex-shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]
        h-full overflow-hidden
      `}
    >
      {/* Содержимое видно только когда сайдбар открыт */}
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Заголовок */}
          <div className="p-4 pb-1">
            <h2 className="text-xl font-bold text-[#274E7D]">Конспект</h2>
          </div>
          
          {/* Основное содержимое (пустое пространство) */}
          <div className="flex-1" />
          
          {/* Кнопка конспектирования внизу */}
          <div className="p-3 border-t border-[#274E7D]/5 bg-gray-50/50">
            <button
              onClick={onCreateSummary}
              className="w-full rounded-xl border border-[#274E7D]/30 flex items-center justify-center gap-2 text-[#274E7D] hover:bg-[#274E7D]/5 hover:border-[#274E7D] transition-all group bg-white py-4"
            >
              <div className="p-2 bg-[#274E7D]/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                <Sparkles size={20} />
              </div>
              <span className="font-bold text-sm">Законспектировать</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};