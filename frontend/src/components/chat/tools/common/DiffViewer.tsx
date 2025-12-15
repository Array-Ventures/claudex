import React, { useMemo, useCallback, useState, memo } from 'react';
import { diffLines as diffLinesLib } from 'diff';
import { Diff, Hunk } from 'react-diff-view';
import type { HunkData, ChangeData, EventMap } from 'react-diff-view';
import { Plus } from 'lucide-react';
import 'react-diff-view/style/index.css';
import { cn } from '@/utils/cn';
import { logger } from '@/utils/logger';

interface DiffChange {
  count?: number;
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filename?: string;
  reviewMode?: boolean;
  operationId?: string;
  onLineSelect?: (
    lineStart: number,
    lineEnd: number,
    selectedCode: string,
    changeType: 'insert' | 'delete' | 'normal',
  ) => void;
  selectedRange?: { start: number; end: number } | null;
}

interface RenderGutterProps {
  change: ChangeData;
  side: 'old' | 'new';
  renderDefault: () => React.ReactNode;
  inHoverState: boolean;
}

const convertToHunks = (changes: DiffChange[]): HunkData[] => {
  const hunkChanges: ChangeData[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (const change of changes) {
    const lines = change.value.split('\n');
    if (change.value.endsWith('\n')) {
      lines.pop();
    }

    for (const line of lines) {
      if (change.added) {
        hunkChanges.push({
          type: 'insert',
          content: `+${line}`,
          isInsert: true,
          lineNumber: newLine,
        });
        newLine++;
      } else if (change.removed) {
        hunkChanges.push({
          type: 'delete',
          content: `-${line}`,
          isDelete: true,
          lineNumber: oldLine,
        });
        oldLine++;
      } else {
        hunkChanges.push({
          type: 'normal',
          content: ` ${line}`,
          isNormal: true,
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
        oldLine++;
        newLine++;
      }
    }
  }

  if (hunkChanges.length === 0) {
    return [];
  }

  const oldLines = hunkChanges.filter((c) => c.type === 'delete' || c.type === 'normal').length;
  const newLines = hunkChanges.filter((c) => c.type === 'insert' || c.type === 'normal').length;

  return [
    {
      content: '@@ -1,' + oldLines + ' +1,' + newLines + ' @@',
      oldStart: 1,
      oldLines,
      newStart: 1,
      newLines,
      changes: hunkChanges,
    },
  ];
};

const getLineNumber = (change: ChangeData): number | null => {
  if (change.type === 'insert') return change.lineNumber as number;
  if (change.type === 'delete') return change.lineNumber as number;
  if (change.type === 'normal') return (change.newLineNumber || change.oldLineNumber) as number;
  return null;
};

const getChangeType = (change: ChangeData): 'insert' | 'delete' | 'normal' => {
  if (change.type === 'insert') return 'insert';
  if (change.type === 'delete') return 'delete';
  return 'normal';
};

const DiffViewerInner: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  reviewMode = false,
  onLineSelect,
  selectedRange,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDraggingFromPlusIcon, setIsDraggingFromPlusIcon] = useState(false);

  const hunks = useMemo(() => {
    const changes = diffLinesLib(oldContent, newContent) as DiffChange[];
    return convertToHunks(changes);
  }, [oldContent, newContent]);

  const handleTextSelection = useCallback(() => {
    try {
      if (!reviewMode || !onLineSelect) {
        return;
      }

      const browserSelection = window.getSelection();
      if (
        !browserSelection ||
        browserSelection.isCollapsed ||
        !browserSelection.toString().trim()
      ) {
        return;
      }

      if (!isDraggingFromPlusIcon) {
        return;
      }

      const container = containerRef.current;
      const containsNode =
        container && browserSelection.anchorNode && container.contains(browserSelection.anchorNode);
      if (!container || !containsNode) {
        return;
      }

      const selectedText = browserSelection.toString();
      const lineNumbers: number[] = [];
      let changeType: 'insert' | 'delete' | 'normal' | null = null;
      let shouldAbort = false;

      const gutterElements = container.querySelectorAll('[data-line-number]');

      for (const gutterEl of gutterElements) {
        const lineNumStr = gutterEl.getAttribute('data-line-number');
        if (!lineNumStr) continue;

        const lineNum = parseInt(lineNumStr, 10);
        if (isNaN(lineNum) || lineNum <= 0) continue;

        const lineChangeTypeStr = gutterEl.getAttribute('data-change-type');
        if (!lineChangeTypeStr || !['insert', 'delete', 'normal'].includes(lineChangeTypeStr))
          continue;

        const lineChangeType = lineChangeTypeStr as 'insert' | 'delete' | 'normal';

        const codeRow = gutterEl.closest('tr');
        if (!codeRow) continue;

        const codeCell = codeRow.querySelector('td.diff-code');
        if (!codeCell) continue;

        let cellIntersects = false;
        for (let i = 0; i < browserSelection.rangeCount; i++) {
          const selectionRange = browserSelection.getRangeAt(i);

          if (selectionRange.intersectsNode(codeCell)) {
            cellIntersects = true;
            break;
          }
        }

        if (cellIntersects) {
          if (changeType === null) {
            changeType = lineChangeType;
          } else if (changeType !== lineChangeType) {
            shouldAbort = true;
            break;
          }

          lineNumbers.push(lineNum);
        }

        if (shouldAbort) break;
      }

      if (shouldAbort) {
        return;
      }

      if (lineNumbers.length === 0 || changeType === null) {
        return;
      }

      const startLine = Math.min(...lineNumbers);
      const endLine = Math.max(...lineNumbers);

      onLineSelect(startLine, endLine, selectedText.trim(), changeType);

      browserSelection.removeAllRanges();
    } catch (error) {
      logger.error('Text selection failed', 'DiffViewer', error);
    } finally {
      setIsDraggingFromPlusIcon(false);
    }
  }, [reviewMode, onLineSelect, isDraggingFromPlusIcon]);

  const isLineInSelection = useCallback(
    (change: ChangeData): boolean => {
      const lineNum = getLineNumber(change);
      if (lineNum === null) return false;

      if (selectedRange) {
        return lineNum >= selectedRange.start && lineNum <= selectedRange.end;
      }

      return false;
    },
    [selectedRange],
  );

  const interactionEvents: EventMap = useMemo(() => {
    return {};
  }, []);

  const renderGutter = useCallback(
    ({ change, side, renderDefault, inHoverState }: RenderGutterProps) => {
      if (side === 'old') {
        return null;
      }

      if (!reviewMode) {
        return renderDefault();
      }

      const isSelected = isLineInSelection(change);
      const lineNumber = getLineNumber(change);

      return (
        <div
          className={cn(
            'relative h-full w-full px-2 text-right',
            'select-text transition-colors',
            inHoverState && !isSelected && 'bg-brand-500/10',
            isSelected && 'bg-brand-500/20 font-semibold',
          )}
          data-line-number={lineNumber}
          data-change-type={getChangeType(change)}
        >
          {inHoverState && (
            <div
              className={cn(
                'absolute -right-6 top-1/2 -translate-y-1/2',
                'h-5 w-5 rounded-full bg-brand-500',
                'flex items-center justify-center',
                'transition-opacity duration-150',
                'cursor-pointer',
              )}
              onMouseDown={() => {
                setIsDraggingFromPlusIcon(true);
              }}
            >
              <Plus className="h-3 w-3 text-white" />
            </div>
          )}
          <span className={cn(inHoverState && 'font-medium')}>{lineNumber}</span>
        </div>
      );
    },
    [reviewMode, isLineInSelection],
  );

  if (hunks.length === 0) {
    return (
      <div className="p-2 text-xs text-text-tertiary dark:text-text-dark-tertiary">
        No changes detected
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'diff-viewer-container overflow-x-auto font-mono text-xs',
        reviewMode && 'review-mode',
      )}
      onMouseUp={reviewMode ? handleTextSelection : undefined}
    >
      <Diff
        viewType="unified"
        diffType="modify"
        hunks={hunks}
        renderGutter={reviewMode ? renderGutter : undefined}
        codeEvents={reviewMode ? interactionEvents : undefined}
      >
        {(displayHunks: HunkData[]) =>
          displayHunks.map((hunk, index) => <Hunk key={`hunk-${index}`} hunk={hunk} />)
        }
      </Diff>
    </div>
  );
};

export const DiffViewer = memo(DiffViewerInner);
