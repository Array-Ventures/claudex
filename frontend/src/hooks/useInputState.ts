import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

interface UseInputStateParams {
  chatId: string | undefined;
}

interface UseInputStateResult {
  inputMessage: string;
  setInputMessage: Dispatch<SetStateAction<string>>;
  inputFiles: File[];
  setInputFiles: Dispatch<SetStateAction<File[]>>;
  clearInput: () => void;
}

export function useInputState({ chatId }: UseInputStateParams): UseInputStateResult {
  const [inputMessage, setInputMessage] = useState('');
  const [inputFiles, setInputFiles] = useState<File[]>([]);

  const clearInput = useCallback(() => {
    setInputMessage('');
    setInputFiles([]);
  }, []);

  useEffect(() => {
    clearInput();
  }, [chatId, clearInput]);

  return {
    inputMessage,
    setInputMessage,
    inputFiles,
    setInputFiles,
    clearInput,
  };
}
