import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, FileText } from 'lucide-react';
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
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentSentenceRef = useRef<HTMLSpanElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const {
    sentences,
    currentSentenceIndex, // ← эта позиция сохраняется в БД
    visitedSentences,
    loading,
    isTextLoaded,
    setCurrentSentenceIndex, // ← при изменении этой функции позиция сохраняется
  } = useBookReading(activeSession, activeTab);

  useKeyboardNavigation({
    activeTab,
    isTextLoaded,
    sentencesLength: sentences.length,
    currentSentenceIndex,
    setCurrentSentenceIndex,
  });

  // Плавная прокрутка к текущему предложению
  const scrollToCurrentSentence = useCallback(() => {
    if (!currentSentenceRef.current || !textContainerRef.current) return;
    
    const now = Date.now();
    // Ограничиваем частоту скролла (не чаще чем каждые 50мс)
    if (now - lastScrollTimeRef.current < 50) return;
    lastScrollTimeRef.current = now;
    
    const sentenceElement = currentSentenceRef.current;
    const container = textContainerRef.current;
    
    // Отменяем предыдущую анимацию
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    const startTime = Date.now();
    const duration = 300; // 300ms для плавности
    const startScrollTop = container.scrollTop;
    const sentenceTop = sentenceElement.offsetTop;
    const containerHeight = container.clientHeight;
    const sentenceHeight = sentenceElement.offsetHeight;
    
    // Целевая позиция - центр предложения в центре контейнера
    const targetScrollTop = sentenceTop - (containerHeight / 2) + (sentenceHeight / 2);
    
    const animateScroll = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Кубическая функция для плавного ускорения и замедления
      const easeInOutCubic = (t: number) => {
        return t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      
      const easedProgress = easeInOutCubic(progress);
      const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easedProgress;
      
      container.scrollTop = currentScrollTop;
      
      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
      } else {
        scrollAnimationRef.current = null;
      }
    };
    
    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  }, []);

  // Прокручиваем при изменении текущего предложения
  useEffect(() => {
    if (isTextLoaded && currentSentenceIndex >= 0) {
      scrollToCurrentSentence();
    }
  }, [currentSentenceIndex, isTextLoaded, scrollToCurrentSentence]);

  // Очистка анимации при размонтировании
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#274E7D]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative shadow-2xl">
        
        {/* Верхние элементы управления */}
        <div className="h-20 flex items-center justify-between px-8 bg-[#FDFDFD] border-b border-[#274E7D]/5 z-10">
          <h2 className="text-xl font-bold text-[#274E7D] truncate max-w-md">
            {activeSession?.title}
            {activeSession?.author && ` — ${activeSession.author}`}
          </h2>

          <div className="flex bg-[#F5F5F0] p-1 rounded-full border border-gray-200">
            <button 
              onClick={() => setActiveTab('BOOK')}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-full transition-all text-sm font-bold
                ${activeTab === 'BOOK' 
                  ? 'bg-[#274E7D] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-[#274E7D]'}
              `}
            >
              <BookOpen size={16} />
              Книга
            </button>
            <button 
              onClick={() => setActiveTab('SUMMARY')}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-full transition-all text-sm font-bold
                ${activeTab === 'SUMMARY' 
                  ? 'bg-[#274E7D] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-[#274E7D]'}
              `}
            >
              <FileText size={16} />
              Конспект
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div 
          className="flex-1 overflow-y-auto bg-[#FDFDFD] relative" 
          ref={textContainerRef}
        >
          <div className="max-w-3xl mx-auto px-8 py-12 min-h-full bg-white shadow-sm my-8 border border-gray-100">
            
            {activeTab === 'BOOK' ? (
              <div className="relative">
                {/* Весь текст книги с разметкой предложений */}
                <div className="prose prose-lg prose-slate max-w-none font-serif">
                  <div className="whitespace-pre-line leading-relaxed text-justify">
                    {sentences.map((sentence, index) => {
                      const isCurrent = index === currentSentenceIndex;
                      
                      return (
                        <span
                          key={index}
                          ref={isCurrent ? currentSentenceRef : null}
                          className={`
                            relative inline-block px-1 transition-all duration-150
                            ${isCurrent ? 'bg-yellow-300 rounded shadow-sm' : ''}
                            hover:bg-gray-50 cursor-pointer
                          `}
                          onClick={() => setCurrentSentenceIndex(index)}
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
                    <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="text-xl font-bold text-[#274E7D] mb-2">Конспект книги</h3>
                      <p className="text-gray-600">"{activeSession?.title}" {activeSession?.author && `- ${activeSession.author}`}</p>
                    </div>
                    
                    <div className="whitespace-pre-wrap p-6 bg-gray-50 rounded-lg">
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
                      className="px-6 py-3 bg-[#274E7D] text-white rounded-lg hover:bg-[#1f3d61] transition-colors flex items-center gap-2 mx-auto"
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