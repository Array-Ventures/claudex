import { memo } from 'react';

export interface MessageSkeletonProps {
  isBot?: boolean;
  className?: string;
}

export interface ChatSkeletonProps {
  messageCount?: number;
  className?: string;
}

const MessageSkeleton = memo(function MessageSkeleton({
  isBot = false,
  className = '',
}: MessageSkeletonProps) {
  return (
    <div className={`pt-8 ${className}`}>
      <div className="flex gap-6">
        <div className="mt-1 flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-border/50 to-border-secondary/50 blur-md dark:from-text-dark-quaternary/20 dark:to-surface-dark-tertiary/20" />
            <div className="relative rounded-xl border border-border bg-surface/50 p-2 backdrop-blur-sm dark:border-border-dark dark:bg-surface-dark">
              <div className="h-5 w-5 animate-pulse rounded bg-text-quaternary dark:bg-text-dark-quaternary" />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <div className="h-3 w-32 animate-pulse rounded bg-text-quaternary dark:bg-text-dark-quaternary" />
            {isBot && (
              <div className="h-4 w-20 animate-pulse rounded bg-border dark:bg-surface-dark-tertiary" />
            )}
          </div>

          <div className="mt-3 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-text-quaternary dark:bg-text-dark-quaternary" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-text-quaternary dark:bg-text-dark-quaternary" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-text-quaternary dark:bg-text-dark-quaternary" />
          </div>

          {isBot && (
            <div className="mt-4 flex items-center gap-2">
              <div className="h-8 w-20 animate-pulse rounded-xl bg-border dark:bg-surface-dark-tertiary" />
              <div className="h-4 w-px bg-border dark:bg-border-dark" />
              <div className="h-8 w-24 animate-pulse rounded-xl bg-border dark:bg-surface-dark-tertiary" />
              <div className="h-8 w-28 animate-pulse rounded-xl bg-border dark:bg-surface-dark-tertiary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const ChatSkeleton = memo(function ChatSkeleton({
  messageCount = 3,
  className = '',
}: ChatSkeletonProps) {
  return (
    <div className={`mx-auto max-w-4xl px-6 ${className}`}>
      {Array.from({ length: messageCount }).map((_, index) => (
        <MessageSkeleton
          key={index}
          isBot={index % 2 === 1}
          className={index === 0 ? 'mt-4' : ''}
        />
      ))}
    </div>
  );
});

export default ChatSkeleton;
