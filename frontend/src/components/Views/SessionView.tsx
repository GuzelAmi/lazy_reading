// components/Views/SessionView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { SessionItem, TabState } from '../../types';
import { sessionsService } from '../../services/sessions';
import { useBookReading } from '../hooks/useBookReading';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface SessionViewProps {
  activeSession: SessionItem | null;
  activeTab: TabState;
  setActiveTab: (t: TabState) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (b: boolean) => void;
  onUpdateProgress?: (sessionId: number, currentPosition: number, totalSentences: number) => void;
}

export const SessionView: React.FC<SessionViewProps> = ({
  activeSession,
  activeTab,
  setActiveTab,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  onUpdateProgress,
}) => {
  const [summary, setSummary] = useState<string>('');
  const lastPositionRef = useRef<number>(0);
  
  const {
    sentences,
    currentSentenceIndex,
    visitedSentences,
    loading,
    isTextLoaded,
    textContainerRef,
    currentSentenceRef,
    setCurrentSentenceIndex,
  } = useBookReading(activeSession, activeTab);

  useKeyboardNavigation({
    activeTab,
    isTextLoaded,
    sentencesLength: sentences.length,
    currentSentenceIndex,
    setCurrentSentenceIndex,
  });

  // Отслеживаем изменения позиции для обновления прогресса
  useEffect(() => {
    if (isTextLoaded && sentences.length > 0 && activeSession && onUpdateProgress) {
      // Обновляем только если позиция изменилась
      if (lastPositionRef.current !== currentSentenceIndex) {
        lastPositionRef.current = currentSentenceIndex;
        
        // Небольшая задержка для дебаунса
        const timer = setTimeout(() => {
          onUpdateProgress(activeSession.id, currentSentenceIndex, sentences.length);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentSentenceIndex, isTextLoaded, sentences.length, activeSession, onUpdateProgress]);

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const handleJumpToSentence = (index: number) => {
    if (index >= 0 && index < sentences.length) {
      setCurrentSentenceIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#274E7D] mx-auto"></div>
            <BookOpen className="absolute inset-0 m-auto text-[#274E7D]" size={24} />
          </div>
          <div>
            <p className="text-[#274E7D] font-medium">Загрузка книги...</p>
            <p className="text-sm text-gray-400 mt-1">Восстанавливаем вашу позицию</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Верхние элементы управления */}
        <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <BookOpen size={20} className="text-[#274E7D]" />
            <div>
              <h2 className="text-lg font-bold text-gray-800 truncate max-w-lg">
                {activeSession?.title}
                {activeSession?.author && (
                  <span className="font-normal text-gray-500 ml-2">— {activeSession.author}</span>
                )}
              </h2>
              {isTextLoaded && sentences.length > 0 && (
                <p className="text-xs text-gray-500">
                  Предложение {currentSentenceIndex + 1} из {sentences.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Навигационные кнопки */}
            {activeTab === 'BOOK' && isTextLoaded && sentences.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={handlePrevSentence}
                  disabled={currentSentenceIndex === 0}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Предыдущее предложение (← или A)"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm text-gray-500 min-w-[80px] text-center">
                  {currentSentenceIndex + 1} / {sentences.length}
                </span>
                <button
                  onClick={handleNextSentence}
                  disabled={currentSentenceIndex === sentences.length - 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Следующее предложение (→ или D)"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('BOOK')}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-medium
                  ${activeTab === 'BOOK' 
                    ? 'bg-white text-[#274E7D] shadow-sm' 
                    : 'text-gray-600 hover:text-[#274E7D]'}
                `}
              >
                <BookOpen size={16} />
                Книга
              </button>
              <button 
                onClick={() => setActiveTab('SUMMARY')}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-medium
                  ${activeTab === 'SUMMARY' 
                    ? 'bg-white text-[#274E7D] shadow-sm' 
                    : 'text-gray-600 hover:text-[#274E7D]'}
                `}
              >
                <FileText size={16} />
                Конспект
              </button>
            </div>
          </div>
        </div>

        {/* Содержимое */}
        <div 
          className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50" 
          ref={textContainerRef}
        >
          <div className="max-w-3xl mx-auto px-6 py-8 min-h-full">
            
            {activeTab === 'BOOK' ? (
              <div className="relative">
                {isTextLoaded && sentences.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">Текст книги пуст или не удалось разобрать</p>
                    <p className="text-sm">Попробуйте загрузить другую книгу</p>
                  </div>
                )}
                
                {/* Весь текст книги с разметкой предложений */}
                <div className="prose prose-lg prose-slate max-w-none font-serif">
                  <div className="whitespace-pre-line leading-relaxed text-justify">
                    {sentences.map((sentence, index) => {
                      const isCurrent = index === currentSentenceIndex;
                      const isVisited = visitedSentences.has(index);
                      
                      return (
                        <span
                          key={index}
                          ref={isCurrent ? currentSentenceRef : null}
                          className={`
                            relative inline-block px-1.5 py-0.5 cursor-pointer
                            ${isCurrent 
                              ? 'bg-yellow-200 rounded border border-yellow-300' 
                              : isVisited 
                                ? 'text-gray-700' 
                                : 'text-gray-900'}
                            hover:bg-gray-50
                          `}
                          onClick={() => handleJumpToSentence(index)}
                        >
                          {sentence}
                          {index < sentences.length - 1 && ' '}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-lg prose-slate text-gray-700 leading-relaxed font-serif max-w-none">
                {summary ? (
                  <div>
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <h3 className="text-xl font-bold text-[#274E7D] mb-2">Конспект книги</h3>
                      <p className="text-gray-600">"{activeSession?.title}" {activeSession?.author && `- ${activeSession.author}`}</p>
                    </div>
                    
                    <div className="whitespace-pre-wrap p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      {summary}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">Конспект пока не создан</h3>
                    <p className="mb-6">Откройте правую панель и нажмите "Законспектировать"</p>
                    <button 
                      onClick={() => setIsRightSidebarOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-[#274E7D] to-[#3a6ba5] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 mx-auto shadow-md"
                    >
                      <FileText size={20} />
                      Открыть панель конспекта
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};