// components/Views/SessionView.tsx
import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { SessionItem, TabState } from '../../types';
import { sessionsService } from '../../services';
import { useBookReading } from '../hooks/useBookReading';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface SessionViewProps {
  activeSession: SessionItem | null;
  activeTab: TabState;
  setActiveTab: (t: TabState) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (b: boolean) => void;
}

export const SessionView: React.FC<SessionViewProps> = ({
  activeSession,
  activeTab,
  setActiveTab,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
}) => {
  const [summary, setSummary] = useState<string>('');
  
  const {
    sentences,
    currentSentenceIndex,
    visitedSentences,
    loading,
    isTextLoaded,
    textContainerRef,
    currentSentenceRef,
    setCurrentSentenceIndex,
    scrollToCurrentSentence,
  } = useBookReading(activeSession, activeTab);

  useKeyboardNavigation({
    activeTab,
    isTextLoaded,
    sentencesLength: sentences.length,
    currentSentenceIndex,
    setCurrentSentenceIndex,
  });

  // Состояние для отображения восстановленной позиции
  const [showRestoredPosition, setShowRestoredPosition] = useState(false);

  useEffect(() => {
    if (isTextLoaded && currentSentenceIndex > 0) {
      // Показываем уведомление о восстановлении позиции
      setShowRestoredPosition(true);
      const timer = setTimeout(() => {
        setShowRestoredPosition(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isTextLoaded, currentSentenceIndex]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!activeSession || activeTab !== 'SUMMARY') return;
      
      try {
        const sessionSummary = await sessionsService.getSessionSummary(activeSession.session_id);
        if (sessionSummary) {
          setSummary(sessionSummary.content);
        } else {
          setSummary('');
        }
      } catch (error) {
        console.error('Error loading summary:', error);
        setSummary('Ошибка загрузки конспекта.');
      }
    };

    loadSummary();
  }, [activeSession, activeTab]);

  // Кнопки навигации
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
              {showRestoredPosition && (
                <p className="text-xs text-green-600 animate-pulse">
                  ✓ Позиция восстановлена: предложение {currentSentenceIndex + 1} из {sentences.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Навигационные кнопки */}
            {activeTab === 'BOOK' && isTextLoaded && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={handlePrevSentence}
                  disabled={currentSentenceIndex === 0}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Предыдущее предложение (←)"
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
                  title="Следующее предложение (→)"
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
                {/* Индикатор текущей позиции */}
                {isTextLoaded && (
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                    <div className="flex justify-between items-center">
                      <span>
                        <span className="font-bold">Текущая позиция:</span> предложение {currentSentenceIndex + 1} из {sentences.length}
                      </span>
                      <button
                        onClick={() => {
                          setCurrentSentenceIndex(0);
                          setTimeout(() => scrollToCurrentSentence(), 100);
                        }}
                        className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                      >
                        Начать сначала
                      </button>
                    </div>
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
                            relative inline-block px-1.5 py-0.5 transition-all duration-200
                            ${isCurrent 
                              ? 'bg-yellow-200 rounded shadow-sm border border-yellow-300' 
                              : isVisited 
                                ? 'text-gray-700' 
                                : 'text-gray-900'}
                            hover:bg-gray-50 cursor-pointer mx-0.5
                          `}
                          onClick={() => {
                            setCurrentSentenceIndex(index);
                            setTimeout(() => scrollToCurrentSentence(), 50);
                          }}
                          title={isCurrent ? "Текущее предложение" : "Нажмите для перехода"}
                        >
                          {sentence}
                          {index < sentences.length - 1 && ' '}
                          
                          {/* Индикатор посещенного предложения */}
                          {isVisited && !isCurrent && (
                            <span className="absolute -left-1 top-1/2 w-1 h-1 bg-blue-500 rounded-full transform -translate-y-1/2"></span>
                          )}
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