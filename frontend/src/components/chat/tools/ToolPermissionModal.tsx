import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button, MarkDown } from '@/components/ui';
import type { PermissionRequest } from '@/types';

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(value, null, 2);
}

interface ToolPermissionModalProps {
  request: PermissionRequest | null;
  onApprove: () => void;
  onReject: (alternativeInstruction?: string) => void;
  isLoading?: boolean;
}

export function ToolPermissionModal({
  request,
  onApprove,
  onReject,
  isLoading = false,
}: ToolPermissionModalProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [alternativeInstruction, setAlternativeInstruction] = useState('');

  if (!request) return null;

  const handleReject = () => {
    if (showRejectInput && alternativeInstruction.trim()) {
      onReject(alternativeInstruction.trim());
      setAlternativeInstruction('');
      setShowRejectInput(false);
    } else {
      setShowRejectInput(true);
    }
  };

  const handleJustReject = () => {
    onReject();
    setShowRejectInput(false);
    setAlternativeInstruction('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-strong dark:border-border-dark dark:bg-surface-dark">
        <div className="border-b border-border px-4 py-3 dark:border-border-dark">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-yellow-100 p-1.5 dark:bg-yellow-900/30">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                Permission Required
              </h2>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                Tool: <code className="font-mono">{request.tool_name}</code>
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="max-h-96 space-y-2 overflow-auto">
              {!request.tool_input || Object.keys(request.tool_input).length === 0 ? (
                <div className="py-2 text-sm italic text-text-secondary dark:text-text-dark-secondary">
                  No parameters
                </div>
              ) : (
                Object.entries(request.tool_input).map(([key, value]) => (
                  <div key={key} className="space-y-0.5">
                    <div className="text-2xs font-medium uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
                      {key}
                    </div>
                    <div className="overflow-auto rounded bg-surface-tertiary px-2 py-1.5 text-xs text-text-primary dark:bg-surface-dark-tertiary dark:text-text-dark-primary">
                      <MarkDown content={formatValue(value)} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {showRejectInput && (
              <div>
                <label className="text-xs font-medium text-text-tertiary dark:text-text-dark-tertiary">
                  Alternative Instructions
                </label>
                <textarea
                  value={alternativeInstruction}
                  onChange={(e) => setAlternativeInstruction(e.target.value)}
                  placeholder="Tell the agent what to do instead..."
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-tertiary px-2.5 py-2 text-sm text-text-primary placeholder-text-quaternary focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-border-dark dark:bg-surface-dark-tertiary dark:text-text-dark-primary dark:placeholder-text-dark-tertiary"
                  rows={3}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-border px-4 py-3 dark:border-border-dark">
          {showRejectInput ? (
            <>
              <Button
                onClick={handleJustReject}
                variant="secondary"
                disabled={isLoading}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Just Reject
              </Button>
              <Button
                onClick={handleReject}
                variant="primary"
                disabled={isLoading || !alternativeInstruction.trim()}
                className="flex-1"
              >
                Send Instructions
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleReject}
                variant="secondary"
                disabled={isLoading}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={onApprove} variant="primary" disabled={isLoading} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
