import React from 'react';
import { Plus } from 'lucide-react';

interface HomeViewProps {
  onUploadClick: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onUploadClick }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-opacity duration-500">
    {/* Прозрачный водяной знак */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <h1 className="text-[12vw] font-bold text-[#274E7D] opacity-[0.04] whitespace-nowrap blur-sm">
        lazy reading
      </h1>
    </div>

    {/* Центральная кнопка загрузки */}
    <div className="z-10 text-center animate-in fade-in zoom-in duration-700">
      <button 
        className="group relative flex flex-col items-center gap-6 p-12 rounded-2xl hover:bg-white/50 transition-all duration-500"
        onClick={onUploadClick}
      >
        <div className="relative">
          <div className="w-32 h-44 bg-white border border-[#274E7D]/20 rounded-lg shadow-[8px_8px_0px_0px_rgba(39,78,125,0.15)] flex flex-col items-center justify-center group-hover:-translate-y-4 group-hover:shadow-[16px_16px_0px_0px_rgba(39,78,125,0.1)] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-[#f0f0f0] rounded-bl-lg"></div> 
            <Plus size={48} className="text-[#274E7D]/40 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute bottom-4 w-16 h-1 bg-[#274E7D]/10 rounded-full"></div>
            <div className="absolute bottom-7 w-20 h-1 bg-[#274E7D]/10 rounded-full"></div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className={`text-2xl font-serif text-[#274E7D] group-hover:font-bold transition-all`}>
            Загрузить новую книгу
          </span>
          <span className="text-sm text-gray-400">TXT формат</span>
        </div>
      </button>
    </div>
  </div>
);