import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

interface UseSuggestionBaseOptions<T> {
  suggestions: T[];
  hasSuggestions: boolean;
  onSelect: (item: T) => void;
}

export const useSuggestionBase = <T>({
  suggestions,
  hasSuggestions,
  onSelect,
}: UseSuggestionBaseOptions<T>) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    if (!hasSuggestions) {
      setHighlightedIndex(0);
      return;
    }
    setHighlightedIndex((prev) => (prev < suggestions.length ? prev : 0));
  }, [suggestions, hasSuggestions]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<Element>) => {
      if (!hasSuggestions) return false;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        return true;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return true;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const item = suggestions[highlightedIndex];
        if (item) onSelect(item);
        return true;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setHighlightedIndex(0);
        return true;
      }

      return false;
    },
    [suggestions, hasSuggestions, highlightedIndex, onSelect],
  );

  return {
    highlightedIndex,
    selectItem: onSelect,
    handleKeyDown,
  } as const;
};
