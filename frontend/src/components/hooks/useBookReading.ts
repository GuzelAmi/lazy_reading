// hooks/useBookReading.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionItem } from '../../types';
import { booksService, sessionsService } from '../../services';

interface UseBookReadingReturn {
  // Состояния
  bookText: string;
  sentences: string[];
  currentSentenceIndex: number;
  visitedSentences: Set<number>;
  loading: boolean;
  isTextLoaded: boolean;
  textContainerRef: React.RefObject<HTMLDivElement>;
  currentSentenceRef: React.RefObject<HTMLSpanElement>;
  
  // Функции
  setCurrentSentenceIndex: (index: number) => void;
  loadBookData: () => Promise<void>;
  cleanText: (text: string) => string;
  splitIntoSentences: (text: string) => string[];
  scrollToCurrentSentence: () => void;
}

export const useBookReading = (activeSession: SessionItem | null, activeTab: 'BOOK' | 'SUMMARY'): UseBookReadingReturn => {
  const [bookText, setBookText] = useState<string>('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [visitedSentences, setVisitedSentences] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [isTextLoaded, setIsTextLoaded] = useState<boolean>(false);
  
  const currentSentenceRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef<boolean>(false);
  const hasRestoredPositionRef = useRef<boolean>(false);

  // Сохраняем позицию в БД с дебаунсом
  const savePositionToDB = useCallback(async (sessionId: number, position: number) => {
    if (isSavingRef.current) return;
    
    isSavingRef.current = true;
    try {
      await sessionsService.updateSessionPosition(sessionId, position);
    } catch (error) {
      console.error('Error saving position:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Плавная прокрутка к текущему предложению
  const scrollToCurrentSentence = useCallback(() => {
    if (!currentSentenceRef.current || !textContainerRef.current) return;
    
    const sentenceElement = currentSentenceRef.current;
    const container = textContainerRef.current;
    
    // Отменяем предыдущую анимацию
    if ((window as any).scrollAnimation) {
      cancelAnimationFrame((window as any).scrollAnimation);
    }
    
    const startTime = Date.now();
    const duration = 500; // Плавная анимация 500ms
    const startScrollTop = container.scrollTop;
    const sentenceTop = sentenceElement.offsetTop;
    const containerHeight = container.clientHeight;
    const sentenceHeight = sentenceElement.offsetHeight;
    
    // Целевая позиция - предложение в центре контейнера
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
        (window as any).scrollAnimation = requestAnimationFrame(animateScroll);
      } else {
        (window as any).scrollAnimation = null;
      }
    };
    
    (window as any).scrollAnimation = requestAnimationFrame(animateScroll);
  }, []);

  // Очистка текста от HTML и рекламы
  const cleanText = useCallback((text: string): string => {
    if (!text) return '';
    
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    const royallibPatterns = [
      /Спасибо, что скачали книгу в бесплатной электронной библиотеке Royallib\.ru.*/g,
      /Все книги автора:.*/g,
      /Эта же книга в других форматах:.*/g,
      /Приятного чтения!.*/g,
      /http:\/\/royallib\.ru.*/g,
      /Приправа: \d+%.*/g,
      /Предложение \d+ из \d+/g,
      /Предыдущее.*/g,
      /Следующее.*/g,
      /Кликните чтобы выделить это предложение.*/g,
      /Статистика чтения.*/g,
      /Выделенных предложений.*/g,
      /Осталось прочитать.*/g,
      /\|.*\|/g,
    ];
    
    royallibPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned.trim();
  }, []);

  // Разбиение текста на предложения
  const splitIntoSentences = useCallback((text: string): string[] => {
    if (!text) return [];
    
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 3);
  }, []);

  // Загрузка данных книги
  const loadBookData = useCallback(async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      hasRestoredPositionRef.current = false;
      
      // Загружаем информацию о сессии (чтобы получить сохраненную позицию)
      const sessionInfo = await sessionsService.getSession(activeSession.session_id);
      
      const rawText = await booksService.getBookText(activeSession.book_id);
      const cleanedText = cleanText(rawText);
      setBookText(cleanedText);
      
      const sentenceArray = splitIntoSentences(cleanedText);
      setSentences(sentenceArray);
      setIsTextLoaded(true);
      
      // Восстанавливаем сохраненную позицию из БД
      const savedPosition = sessionInfo.current_position || 0;
      
      // Проверяем валидность позиции
      let initialPosition = 0;
      if (savedPosition > 0 && savedPosition < sentenceArray.length) {
        initialPosition = savedPosition;
        console.log(`Восстановлена позиция: ${initialPosition}/${sentenceArray.length}`);
      } else if (savedPosition >= sentenceArray.length) {
        // Если позиция больше количества предложений, ставим на последнее
        initialPosition = Math.max(0, sentenceArray.length - 1);
        console.log(`Позиция скорректирована: ${initialPosition}`);
      }
      
      setCurrentSentenceIndex(initialPosition);
      hasRestoredPositionRef.current = true;
      
      // Загружаем существующие выделения
      try {
        const existingHighlights = await sessionsService.getSessionHighlights(activeSession.session_id);
        const visitedSet = new Set(existingHighlights.map(h => h.sentence_index));
        setVisitedSentences(visitedSet);
      } catch (error) {
        console.warn('Не удалось загрузить выделения:', error);
        setVisitedSentences(new Set());
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных книги:', error);
      setBookText('Ошибка загрузки текста книги.');
    } finally {
      setLoading(false);
    }
  }, [activeSession, cleanText, splitIntoSentences]);

  // Прокрутка к восстановленной позиции после загрузки
  useEffect(() => {
    if (isTextLoaded && hasRestoredPositionRef.current && currentSentenceIndex >= 0 && sentences.length > 0) {
      // Ждем немного чтобы DOM успел отрендериться
      const timer = setTimeout(() => {
        if (currentSentenceRef.current && textContainerRef.current) {
          console.log(`Прокрутка к предложению ${currentSentenceIndex}`);
          scrollToCurrentSentence();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isTextLoaded, currentSentenceIndex, sentences.length, scrollToCurrentSentence]);

  // Сохранение посещенного предложения
  useEffect(() => {
    const saveVisitedSentence = async () => {
      if (!activeSession || !isTextLoaded || visitedSentences.has(currentSentenceIndex)) return;
      
      try {
        const sentenceText = sentences[currentSentenceIndex];
        await sessionsService.addHighlight(activeSession.session_id, {
          sentence_index: currentSentenceIndex,
          text: sentenceText
        });
        
        setVisitedSentences(prev => new Set(prev).add(currentSentenceIndex));
      } catch (error) {
        console.error('Ошибка сохранения выделения:', error);
      }
    };

    saveVisitedSentence();
  }, [currentSentenceIndex, activeSession, isTextLoaded, sentences, visitedSentences]);

  // Сохранение позиции в БД при изменении
  useEffect(() => {
    if (activeSession && isTextLoaded && currentSentenceIndex >= 0) {
      // Сохраняем с дебаунсом 500ms
      const timer = setTimeout(() => {
        savePositionToDB(activeSession.session_id, currentSentenceIndex);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentSentenceIndex, activeSession, isTextLoaded, savePositionToDB]);

  // Загрузка при изменении активной сессии
  useEffect(() => {
    if (activeSession && activeTab === 'BOOK') {
      loadBookData();
    }
  }, [activeSession, activeTab, loadBookData]);

  const setCurrentSentenceIndexWithSave = useCallback((index: number) => {
    setCurrentSentenceIndex(index);
  }, []);

  return {
    bookText,
    sentences,
    currentSentenceIndex,
    visitedSentences,
    loading,
    isTextLoaded,
    textContainerRef,
    currentSentenceRef,
    setCurrentSentenceIndex: setCurrentSentenceIndexWithSave,
    loadBookData,
    cleanText,
    splitIntoSentences,
    scrollToCurrentSentence,
  };
};