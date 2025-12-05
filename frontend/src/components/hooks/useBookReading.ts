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
  
  // Функции
  setCurrentSentenceIndex: (index: number) => void;
  loadBookData: () => Promise<void>;
  cleanText: (text: string) => string;
  splitIntoSentences: (text: string) => string[];
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
    
    // Загружаем информацию о сессии (чтобы получить сохраненную позицию)
    const sessionInfo = await sessionsService.getSession(activeSession.session_id);
    
    const rawText = await booksService.getBookText(activeSession.book_id);
    const cleanedText = cleanText(rawText);
    setBookText(cleanedText);
    
    const sentenceArray = splitIntoSentences(cleanedText);
    setSentences(sentenceArray);
    setIsTextLoaded(true);
    
    // Восстанавливаем сохраненную позицию из БД
    // Если позиция не сохранена (0) или невалидна, ставим первое предложение
    if (sessionInfo.current_position !== undefined && 
        sessionInfo.current_position > 0 && 
        sessionInfo.current_position < sentenceArray.length) {
      setCurrentSentenceIndex(sessionInfo.current_position);
    } else {
      // Первый вход - начинаем с первого предложения
      setCurrentSentenceIndex(0);
      // Сохраняем стартовую позицию
      if (activeSession) {
        savePositionToDB(activeSession.session_id, 0);
      }
    }
    
    // Загружаем существующие выделения
    const existingHighlights = await sessionsService.getSessionHighlights(activeSession.session_id);
    const visitedSet = new Set(existingHighlights.map(h => h.sentence_index));
    setVisitedSentences(visitedSet);
    
  } catch (error) {
    console.error('Error loading book data:', error);
    setBookText('Ошибка загрузки текста книги.');
  } finally {
    setLoading(false);
  }
}, [activeSession, cleanText, splitIntoSentences, savePositionToDB]);
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
        console.error('Error saving highlight:', error);
      }
    };

    saveVisitedSentence();
  }, [currentSentenceIndex, activeSession, isTextLoaded, sentences, visitedSentences]);

  // Сохранение позиции в БД при изменении
  useEffect(() => {
    if (activeSession && isTextLoaded) {
      // Сохраняем с небольшой задержкой (дебаунс)
      const timer = setTimeout(() => {
        savePositionToDB(activeSession.session_id, currentSentenceIndex);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentSentenceIndex, activeSession, isTextLoaded, savePositionToDB]);

  // Прокрутка к текущему предложению
  useEffect(() => {
    if (currentSentenceRef.current && textContainerRef.current) {
      const sentenceElement = currentSentenceRef.current;
      const container = textContainerRef.current;
      
      const sentenceRect = sentenceElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      if (sentenceRect.top < containerRect.top || sentenceRect.bottom > containerRect.bottom) {
        sentenceElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentSentenceIndex]);

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
    setCurrentSentenceIndex: setCurrentSentenceIndexWithSave,
    loadBookData,
    cleanText,
    splitIntoSentences,
  };
};