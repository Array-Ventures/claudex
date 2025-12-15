import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function useInitialPrompt() {
  const location = useLocation();
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  const initialPromptFromRoute = useMemo(() => {
    const state = location.state as { initialPrompt?: string } | null;
    const queryParamPrompt = new URLSearchParams(location.search).get('initialPrompt');
    return state?.initialPrompt ?? queryParamPrompt ?? null;
  }, [location.state, location.search]);

  useEffect(() => {
    if (initialPromptFromRoute) {
      setInitialPrompt(initialPromptFromRoute);
    }
  }, [initialPromptFromRoute]);

  return {
    initialPrompt,
    setInitialPrompt,
    initialPromptSent,
    setInitialPromptSent,
    initialPromptFromRoute,
  };
}
