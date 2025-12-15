import { createContext } from 'react';
import type { FileStructure, CustomAgent, CustomCommand } from '@/types';

export interface ChatContextValue {
  chatId?: string;
  sandboxId?: string;
  fileStructure: FileStructure[];
  customAgents: CustomAgent[];
  customSlashCommands: CustomCommand[];
}

export const ChatContext = createContext<ChatContextValue | null>(null);
