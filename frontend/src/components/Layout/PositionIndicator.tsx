// components/Layout/PositionIndicator.tsx
import React from 'react';
import { RotateCcw, Check } from 'lucide-react';

interface PositionIndicatorProps {
  currentPosition: number;
  totalSentences: number;
  isLoading: boolean;
  isRestored: boolean;
}

export const PositionIndicator: React.FC<PositionIndicatorProps> = ({
  currentPosition,
  totalSentences,
  isLoading,
  isRestored,
}) => {
  const percentage = totalSentences > 0 
    ? Math.round(((currentPosition + 1) / totalSentences) * 100) 
    : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">Восстановление позиции...</span>
        </div>
      ) : isRestored ? (
        <div className="flex items-center gap-2">
          <Check size={16} className="text-green-600" />
          <div>
            <span className="text-sm font-medium text-green-700">
              Позиция восстановлена
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>{currentPosition + 1} / {totalSentences}</span>
              <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span>{percentage}%</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};