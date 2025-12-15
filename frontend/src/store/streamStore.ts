import { create } from 'zustand';
import { logger } from '@/utils/logger';
import type { ActiveStream, StreamMetadata } from '@/types';

interface StreamState {
  activeStreams: Map<string, ActiveStream>;
  streamIdByChatMessage: Map<string, string>;
  activeStreamMetadata: StreamMetadata[];
  addStream: (stream: ActiveStream) => void;
  removeStream: (streamId: string) => void;
  getStream: (streamId: string) => ActiveStream | undefined;
  getStreamByChatAndMessage: (chatId: string, messageId: string) => ActiveStream | undefined;
  updateStreamCallbacks: (
    chatId: string,
    messageId: string,
    callbacks: ActiveStream['callbacks'],
  ) => void;
  abortStream: (streamId: string) => void;
  abortAllStreams: () => void;
  removeStreamMetadata: (chatId: string) => void;
  addStreamMetadata: (metadata: StreamMetadata) => void;
}

function getChatMessageKey(chatId: string, messageId: string): string {
  return `${chatId}:${messageId}`;
}

const upsertStreamMetadata = (
  metadata: StreamMetadata[],
  entry: StreamMetadata,
): StreamMetadata[] => {
  const existingIndex = metadata.findIndex((item) => item.chatId === entry.chatId);
  if (existingIndex === -1) {
    return [...metadata, entry];
  }

  const nextMetadata = [...metadata];
  nextMetadata[existingIndex] = entry;
  return nextMetadata;
};

const removeStreamMetadataEntry = (metadata: StreamMetadata[], chatId: string): StreamMetadata[] =>
  metadata.filter((item) => item.chatId !== chatId);

const shutdownStream = (stream: ActiveStream) => {
  try {
    stream.listeners.forEach(({ type, handler }) => {
      stream.source.removeEventListener(type, handler);
    });
    stream.listeners.length = 0;
  } catch (error) {
    logger.error('Stream listener cleanup failed', 'store', error);
  }

  try {
    stream.source.close();
  } catch (error) {
    logger.error('Stream close failed', 'store', error);
  }
};

export const useStreamStore = create<StreamState>((set, get) => ({
  activeStreams: new Map<string, ActiveStream>(),
  streamIdByChatMessage: new Map<string, string>(),
  activeStreamMetadata: [],

  addStream: (stream: ActiveStream) => {
    set((state) => {
      const nextStreams = new Map(state.activeStreams);
      const nextIndex = new Map(state.streamIdByChatMessage);

      nextStreams.set(stream.id, stream);
      nextIndex.set(getChatMessageKey(stream.chatId, stream.messageId), stream.id);

      return {
        activeStreams: nextStreams,
        streamIdByChatMessage: nextIndex,
        activeStreamMetadata: upsertStreamMetadata(state.activeStreamMetadata, {
          chatId: stream.chatId,
          messageId: stream.messageId,
          startTime: stream.startTime,
        }),
      };
    });
  },

  removeStream: (streamId: string) => {
    set((state) => {
      const stream = state.activeStreams.get(streamId);
      if (!stream) return state;

      shutdownStream(stream);
      const nextStreams = new Map(state.activeStreams);
      const nextIndex = new Map(state.streamIdByChatMessage);

      nextStreams.delete(streamId);
      nextIndex.delete(getChatMessageKey(stream.chatId, stream.messageId));

      const hasOtherStreamsForChat = Array.from(nextStreams.values()).some(
        (item) => item.chatId === stream.chatId && item.isActive,
      );

      return {
        activeStreams: nextStreams,
        streamIdByChatMessage: nextIndex,
        activeStreamMetadata: hasOtherStreamsForChat
          ? state.activeStreamMetadata
          : removeStreamMetadataEntry(state.activeStreamMetadata, stream.chatId),
      };
    });
  },

  getStream: (streamId: string) => get().activeStreams.get(streamId),

  getStreamByChatAndMessage: (chatId: string, messageId: string) => {
    const state = get();
    const streamId = state.streamIdByChatMessage.get(getChatMessageKey(chatId, messageId));
    return streamId ? state.activeStreams.get(streamId) : undefined;
  },

  updateStreamCallbacks: (
    chatId: string,
    messageId: string,
    callbacks: ActiveStream['callbacks'],
  ) => {
    const stream = get().getStreamByChatAndMessage(chatId, messageId);
    if (stream && stream.isActive) {
      // Mutate in place - callbacks are internal-only, no need to trigger subscribers
      stream.callbacks = callbacks;
    }
  },

  abortStream: (streamId: string) => {
    get().removeStream(streamId);
  },

  abortAllStreams: () => {
    get().activeStreams.forEach((stream) => {
      shutdownStream(stream);
    });

    set({
      activeStreams: new Map<string, ActiveStream>(),
      streamIdByChatMessage: new Map<string, string>(),
      activeStreamMetadata: [],
    });
  },

  removeStreamMetadata: (chatId: string) => {
    set((state) => {
      const nextStreams = new Map(state.activeStreams);
      const nextIndex = new Map(state.streamIdByChatMessage);

      for (const [id, stream] of state.activeStreams.entries()) {
        if (stream.chatId === chatId) {
          shutdownStream(stream);
          nextStreams.delete(id);
          nextIndex.delete(getChatMessageKey(stream.chatId, stream.messageId));
        }
      }

      return {
        activeStreams: nextStreams,
        streamIdByChatMessage: nextIndex,
        activeStreamMetadata: removeStreamMetadataEntry(state.activeStreamMetadata, chatId),
      };
    });
  },

  addStreamMetadata: (metadata: StreamMetadata) => {
    set((state) => {
      return {
        activeStreamMetadata: upsertStreamMetadata(state.activeStreamMetadata, metadata),
      };
    });
  },
}));
