import { memo, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Panel } from './Panel';
import type { PortInfo } from '@/types';
import { usePreviewLinksQuery } from '@/hooks/queries';
import { Button } from '@/components/ui';

export interface WebPreviewProps {
  sandboxId?: string;
  isActive?: boolean;
}

export const WebPreview = memo(function WebPreview({
  sandboxId,
  isActive = false,
}: WebPreviewProps) {
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);

  const {
    data: ports = [],
    isLoading: loading,
    refetch,
  } = usePreviewLinksQuery(sandboxId || '', {
    enabled: !!sandboxId && isActive,
  });

  const fetchPorts = useCallback(() => {
    refetch();
  }, [refetch]);

  const selectedPort =
    ports.length > 0 ? ports.find((p) => p.port === selectedPortId) || ports[0] : null;

  const setSelectedPort = useCallback((port: PortInfo | null) => {
    setSelectedPortId(port?.port || null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {!sandboxId ? (
        <div className="flex h-full items-center justify-center text-xs text-text-tertiary dark:text-text-dark-tertiary">
          No sandbox connected
        </div>
      ) : ports.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-text-tertiary dark:text-text-dark-tertiary">
          <p className="mb-2 text-xs">No open ports detected</p>
          <Button
            onClick={fetchPorts}
            disabled={loading}
            variant="unstyled"
            className="flex items-center gap-1.5 rounded-md bg-surface-secondary px-2.5 py-1 text-xs transition-colors hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:hover:bg-surface-dark-tertiary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-1">
          <Panel
            previewUrl={selectedPort?.previewUrl}
            ports={ports}
            selectedPort={selectedPort}
            onPortChange={setSelectedPort}
            onRefreshPorts={fetchPorts}
          />
        </div>
      )}
    </div>
  );
});
