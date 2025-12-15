import React, { memo } from 'react';
import { Wrench } from 'lucide-react';
import type { ToolAggregate } from '@/types';
import { ToolCard, ExpandableSection } from './common';

interface MCPToolProps {
  tool: ToolAggregate;
}

const formatToolName = (toolName: string): string => {
  return toolName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(value, null, 2);
};

const MCPToolInner: React.FC<MCPToolProps> = ({ tool }) => {
  const formattedToolName = formatToolName(tool.name);

  const toolStatus = tool.status;
  const errorMessage = tool.error;

  const hasInput = tool.input && Object.keys(tool.input).length > 0;
  const hasResult = tool.result && (Array.isArray(tool.result) ? tool.result.length > 0 : true);

  return (
    <ToolCard
      icon={<Wrench className="h-3.5 w-3.5 text-text-secondary dark:text-text-dark-tertiary" />}
      status={toolStatus}
      title={formattedToolName}
      loadingContent="Processing..."
      error={errorMessage}
    >
      {hasInput || hasResult ? (
        <div className="border-t border-border/50 dark:border-border-dark/50">
          {hasInput ? (
            <ExpandableSection
              label="Input"
              className="pt-2"
              meta={
                <span className="text-text-quaternary dark:text-text-dark-quaternary">
                  {Object.keys(tool.input || {}).length}{' '}
                  {Object.keys(tool.input || {}).length === 1 ? 'param' : 'params'}
                </span>
              }
            >
              <div className="space-y-2 p-3">
                {Object.entries(tool.input || {}).map(([key, value]) => (
                  <div key={key} className="space-y-0.5">
                    <div className="text-2xs font-medium uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
                      {key}
                    </div>
                    <div className="whitespace-pre-wrap break-all rounded bg-black/5 px-2 py-1.5 font-mono text-xs text-text-secondary dark:bg-white/5 dark:text-text-dark-secondary">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          ) : null}

          {hasResult && toolStatus === 'completed' ? (
            <ExpandableSection label="Output">
              <div className="p-3">
                <div className="whitespace-pre-wrap break-all rounded bg-black/5 px-2 py-1.5 font-mono text-xs text-text-secondary dark:bg-white/5 dark:text-text-dark-secondary">
                  {formatValue(tool.result)}
                </div>
              </div>
            </ExpandableSection>
          ) : null}
        </div>
      ) : null}
    </ToolCard>
  );
};

export const MCPTool = memo(MCPToolInner);
