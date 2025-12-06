// hooks/useKeyboardNavigation.ts
import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  activeTab: 'BOOK' | 'SUMMARY';
  isTextLoaded: boolean;
  sentencesLength: number;
  currentSentenceIndex: number;
  setCurrentSentenceIndex: (index: number) => void;
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
      if (activeTab !== 'BOOK' || !isTextLoaded || sentencesLength === 0) return;
      
      // Блокируем нажатия при фокусе на инпутах
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
      )) {
        return;
      }
      
      let newIndex = currentSentenceIndex;
      
      switch(e.key.toLowerCase()) {
        case 'arrowright':
        case ' ':
        case 'd':
          e.preventDefault();
          if (currentSentenceIndex < sentencesLength - 1) {
            newIndex = currentSentenceIndex + 1;
          }
          break;
          
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          if (currentSentenceIndex > 0) {
            newIndex = currentSentenceIndex - 1;
          }
          break;
          
        case 'home':
          e.preventDefault();
          newIndex = 0;
          break;
          
        case 'end':
          e.preventDefault();
          newIndex = sentencesLength - 1;
          break;
          
        case 'j':
          e.preventDefault();
          newIndex = Math.min(currentSentenceIndex + 10, sentencesLength - 1);
          break;
          
        case 'k':
          e.preventDefault();
          newIndex = Math.max(currentSentenceIndex - 10, 0);
          break;
          
        default:
          return;
      }
      
      // Меняем позицию только если она изменилась
      if (newIndex !== currentSentenceIndex) {
        setCurrentSentenceIndex(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, isTextLoaded, sentencesLength, currentSentenceIndex, setCurrentSentenceIndex]);
};