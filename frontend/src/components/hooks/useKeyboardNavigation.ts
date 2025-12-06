// hooks/useKeyboardNavigation.ts
import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  activeTab: 'BOOK' | 'SUMMARY';
  isTextLoaded: boolean;
  sentencesLength: number;
  currentSentenceIndex: number;
  setCurrentSentenceIndex: (index: number | ((prev: number) => number)) => void;
  scrollToCurrentSentence?: () => void;
}

export const useKeyboardNavigation = ({
  activeTab,
  isTextLoaded,
  sentencesLength,
  currentSentenceIndex,
  setCurrentSentenceIndex,
  scrollToCurrentSentence,
}: UseKeyboardNavigationProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Только для вкладки книги с загруженным текстом
      if (activeTab !== 'BOOK' || !isTextLoaded) return;
      
      // Блокируем нажатия при фокусе на инпутах, textarea и т.д.
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'arrowright':
        case ' ':
        case 'd':
          e.preventDefault();
          if (currentSentenceIndex < sentencesLength - 1) {
            setCurrentSentenceIndex(prev => {
              const newIndex = prev + 1;
              // Прокручиваем после обновления
              setTimeout(() => {
                scrollToCurrentSentence?.();
              }, 10);
              return newIndex;
            });
          }
          break;
          
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          if (currentSentenceIndex > 0) {
            setCurrentSentenceIndex(prev => {
              const newIndex = prev - 1;
              setTimeout(() => {
                scrollToCurrentSentence?.();
              }, 10);
              return newIndex;
            });
          }
          break;
          
        case 'home':
          e.preventDefault();
          setCurrentSentenceIndex(0);
          setTimeout(() => {
            scrollToCurrentSentence?.();
          }, 10);
          break;
          
        case 'end':
          e.preventDefault();
          setCurrentSentenceIndex(sentencesLength - 1);
          setTimeout(() => {
            scrollToCurrentSentence?.();
          }, 10);
          break;
          
        case 'j':
          e.preventDefault();
          setCurrentSentenceIndex(prev => Math.min(prev + 10, sentencesLength - 1));
          setTimeout(() => {
            scrollToCurrentSentence?.();
          }, 10);
          break;
          
        case 'k':
          e.preventDefault();
          setCurrentSentenceIndex(prev => Math.max(prev - 10, 0));
          setTimeout(() => {
            scrollToCurrentSentence?.();
          }, 10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, isTextLoaded, sentencesLength, currentSentenceIndex, setCurrentSentenceIndex, scrollToCurrentSentence]);
};