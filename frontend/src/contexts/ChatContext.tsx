import { type ReactNode } from 'react';
import type { FileStructure, CustomAgent, CustomCommand } from '@/types';
import { ChatContext } from './ChatContextDefinition';

interface ChatProviderProps {
  chatId?: string;
  sandboxId?: string;
  fileStructure?: FileStructure[];
  customAgents?: CustomAgent[];
  customSlashCommands?: CustomCommand[];
  children: ReactNode;
}

export function ChatProvider({
  chatId,
  sandboxId,
  fileStructure = [],
  customAgents = [],
  customSlashCommands = [],
  children,
}: ChatProviderProps) {
  return (
    <ChatContext.Provider
      value={{ chatId, sandboxId, fileStructure, customAgents, customSlashCommands }}
    >
      {children}
    </ChatContext.Provider>
  );
}
