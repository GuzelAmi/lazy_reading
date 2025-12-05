// hooks/useKeyboardNavigation.ts
import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  activeTab: 'BOOK' | 'SUMMARY';
  isTextLoaded: boolean;
  sentencesLength: number;
  currentSentenceIndex: number;
  setCurrentSentenceIndex: (index: number | ((prev: number) => number)) => void;
}

export const useKeyboardNavigation = ({
  activeTab,
  isTextLoaded,
  sentencesLength,
  currentSentenceIndex,
  setCurrentSentenceIndex,
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
            setCurrentSentenceIndex(prev => prev + 1);
          }
          break;
          
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          if (currentSentenceIndex > 0) {
            setCurrentSentenceIndex(prev => prev - 1);
          }
          break;
          
        // Убрали arrowup, arrowdown, home, end
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, isTextLoaded, sentencesLength, currentSentenceIndex, setCurrentSentenceIndex]);
};