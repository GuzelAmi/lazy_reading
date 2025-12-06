// hooks/useBookReading.ts - исправляем эффекты
import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionItem } from '../../types';
import { booksService } from '../../services/books';
import { sessionsService } from '../../services/sessions';

interface UseBookReadingReturn {
  sentences: string[];
  currentSentenceIndex: number;
  visitedSentences: Set<number>;
  loading: boolean;
  isTextLoaded: boolean;
  textContainerRef: React.RefObject<HTMLDivElement>;
  currentSentenceRef: React.RefObject<HTMLSpanElement>;
  
  setCurrentSentenceIndex: (index: number) => void;
  loadBookData: () => Promise<void>;
}

export const useBookReading = (activeSession: SessionItem | null, activeTab: 'BOOK' | 'SUMMARY'): UseBookReadingReturn => {
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [visitedSentences, setVisitedSentences] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [isTextLoaded, setIsTextLoaded] = useState<boolean>(false);
  
  const currentSentenceRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lastSessionIdRef = useRef<number | null>(null); // Запоминаем последнюю загруженную сессию
  
  // === ИЗМЕНЕНИЕ 1: Добавляем рефы для плавной анимации скролла ===
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const isInitialScrollDoneRef = useRef<boolean>(false); // Флаг, что первоначальный скролл выполнен

  // === ИЗМЕНЕНИЕ 2: Функция плавной прокрутки к элементу ===
  const scrollToElementSmooth = useCallback((element: HTMLElement, container: HTMLElement) => {
    // Отменяем предыдущую анимацию, если есть
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }

    const now = Date.now();
    // Ограничиваем частоту скролла (не чаще чем каждые 50мс)
    if (now - lastScrollTimeRef.current < 50) return;
    lastScrollTimeRef.current = now;

    const startTime = Date.now();
    const duration = 400; // 400ms для плавности
    const startScrollTop = container.scrollTop;
    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    const containerHeight = container.clientHeight;
    
    // Целевая позиция - центр предложения в центре контейнера
    const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
    
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

  // Загрузка данных книги
  const loadBookData = useCallback(async () => {
    if (!activeSession) return;

    // Если уже загружали эту сессию, не загружаем заново
    if (lastSessionIdRef.current === activeSession.id && isTextLoaded) {
      return;
    }

    try {
      setLoading(true);
      lastSessionIdRef.current = activeSession.id;
      isInitialScrollDoneRef.current = false; // Сбрасываем флаг скролла
      
      // Загружаем текст книги
      const rawText = await booksService.getBookText(activeSession.book_id);
      
      // Очищаем текст
      let cleanedText = rawText.replace(/<[^>]*>/g, '');
      
      // Убираем рекламу
      const patterns = [
        /Спасибо, что скачали книгу в бесплатной электронной библиотеке Royallib\.ru.*/g,
        /Все книги автора:.*/g,
        /Эта же книга в других форматах:.*/g,
        /Приятного чтения!.*/g,
        /http:\/\/royallib\.ru.*/g,
        /Приправа: \d+%.*/g,
        /Предложение \d+ из \d+/g,
      ];
      
      patterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
      });
      
      // Разбиваем на предложения
      const sentences = cleanedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      const filteredSentences = sentences
        .map(s => s.trim())
        .filter(s => s.length > 3);
      
      setSentences(filteredSentences);
      setIsTextLoaded(true);
      
      // Восстанавливаем позицию из сессии
      const savedPosition = activeSession.current_position || 0;
      let initialPosition = 0;
      
      if (savedPosition >= 0 && savedPosition < filteredSentences.length) {
        initialPosition = savedPosition;
      } else if (savedPosition >= filteredSentences.length) {
        initialPosition = Math.max(0, filteredSentences.length - 1);
      }
      
      setCurrentSentenceIndex(initialPosition);
      
      // Загружаем выделения
      try {
        const existingHighlights = await sessionsService.getSessionHighlights(activeSession.id);
        const visitedSet = new Set(existingHighlights.map(h => h.sentence_index));
        setVisitedSentences(visitedSet);
      } catch (error) {
        console.warn('Не удалось загрузить выделения:', error);
        setVisitedSentences(new Set());
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных книги:', error);
      setSentences(['Ошибка загрузки текста книги.']);
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  // Сохранение позиции в БД при изменении - БЕЗ ОБНОВЛЕНИЯ UI!
  useEffect(() => {
    const savePosition = async () => {
      if (!activeSession || !isTextLoaded || sentences.length === 0) return;
      
      try {
        await sessionsService.updateSessionPosition(activeSession.id, currentSentenceIndex);
      } catch (error) {
        console.error('Ошибка сохранения позиции:', error);
      }
    };

    // Дебаунс сохранения позиции (сохраняем только после 1 секунды бездействия)
    const timer = setTimeout(savePosition, 1000);
    return () => clearTimeout(timer);
  }, [currentSentenceIndex, activeSession, isTextLoaded, sentences.length]);

  // Сохранение выделений при посещении предложения
  useEffect(() => {
    const saveVisitedSentence = async () => {
      if (!activeSession || !isTextLoaded || visitedSentences.has(currentSentenceIndex)) return;
      
      try {
        const sentenceText = sentences[currentSentenceIndex];
        await sessionsService.addHighlight(activeSession.id, {
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

  // === ИЗМЕНЕНИЕ 3: Улучшенный эффект для первоначального скролла ===
  useEffect(() => {
    if (isTextLoaded && 
        currentSentenceIndex >= 0 && 
        sentences.length > 0 && 
        !isInitialScrollDoneRef.current) {
      
      const attemptScroll = () => {
        if (currentSentenceRef.current && textContainerRef.current) {
          // Первоначальный скролл делаем сразу, без задержки
          scrollToElementSmooth(currentSentenceRef.current, textContainerRef.current);
          isInitialScrollDoneRef.current = true;
          return true;
        }
        return false;
      };

      // Пытаемся сразу
      if (!attemptScroll()) {
        // Если не получилось, пробуем через небольшой интервал
        const intervalId = setInterval(() => {
          if (attemptScroll()) {
            clearInterval(intervalId);
          }
        }, 50); // Проверяем каждые 50мс

        // Останавливаем попытки через 2 секунды
        setTimeout(() => {
          clearInterval(intervalId);
        }, 2000);

        return () => clearInterval(intervalId);
      }
    }
  }, [isTextLoaded, currentSentenceIndex, sentences.length, scrollToElementSmooth]);

  // === ИЗМЕНЕНИЕ 4: Эффект для последующего скролла (при навигации) ===
  useEffect(() => {
    // Этот эффект срабатывает только после первоначального скролла
    if (isTextLoaded && 
        currentSentenceIndex >= 0 && 
        sentences.length > 0 && 
        isInitialScrollDoneRef.current &&
        currentSentenceRef.current && 
        textContainerRef.current) {
      
      // Для последующих изменений используем задержку
      const timer = setTimeout(() => {
        if (currentSentenceRef.current && textContainerRef.current) {
          scrollToElementSmooth(currentSentenceRef.current, textContainerRef.current);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isTextLoaded, currentSentenceIndex, sentences.length, scrollToElementSmooth]);

  // === ИЗМЕНЕНИЕ 5: Очистка анимации и сброс флагов при смене сессии ===
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  // Сбрасываем флаг скролла при смене активной сессии
  useEffect(() => {
    isInitialScrollDoneRef.current = false;
  }, [activeSession?.id]);

  // Загрузка при изменении активной сессии или вкладки - УЛУЧШАЕМ
  useEffect(() => {
    if (activeSession && activeTab === 'BOOK') {
      // Если уже загружали эту сессию, просто восстанавливаем позицию
      if (lastSessionIdRef.current === activeSession.id && isTextLoaded) {
        const savedPosition = activeSession.current_position || 0;
        if (savedPosition >= 0 && savedPosition < sentences.length) {
          setCurrentSentenceIndex(savedPosition);
        }
      } else {
        // Иначе загружаем данные
        loadBookData();
      }
    }
  }, [activeSession, activeTab, isTextLoaded, sentences.length, loadBookData]);

  // Функция для установки позиции с проверкой границ
  const setCurrentSentenceIndexWithBounds = useCallback((index: number) => {
    const newIndex = Math.max(0, Math.min(index, sentences.length - 1));
    setCurrentSentenceIndex(newIndex);
  }, [sentences.length]);

  return {
    sentences,
    currentSentenceIndex,
    visitedSentences,
    loading,
    isTextLoaded,
    textContainerRef,
    currentSentenceRef,
    setCurrentSentenceIndex: setCurrentSentenceIndexWithBounds,
    loadBookData,
  };
};