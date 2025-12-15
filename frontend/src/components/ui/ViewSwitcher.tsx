import {
  MessagesSquare,
  Code,
  Braces,
  SquareTerminal,
  KeyRound,
  Globe,
  Smartphone,
} from 'lucide-react';
import { useUIStore } from '@/store';
import { cn } from '@/utils/cn';
import type { ViewType } from '@/types/ui.types';
import { LAYOUT_CLASSES } from '@/config/constants';
import { useIsMobile } from '@/hooks';

interface ActivityBarButton {
  view: ViewType;
  icon: typeof MessagesSquare;
  label: string;
  hideOnMobile?: boolean;
}

const buttons: ActivityBarButton[] = [
  { view: 'agent', icon: MessagesSquare, label: 'Agent' },
  { view: 'ide', icon: Braces, label: 'IDE', hideOnMobile: true },
  { view: 'editor', icon: Code, label: 'Editor' },
  { view: 'terminal', icon: SquareTerminal, label: 'Terminal' },
  { view: 'secrets', icon: KeyRound, label: 'Secrets' },
  { view: 'webPreview', icon: Globe, label: 'Web Preview' },
  { view: 'mobilePreview', icon: Smartphone, label: 'Mobile Preview' },
];

export function ActivityBar() {
  const currentView = useUIStore((state) => state.currentView);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  const isMobile = useIsMobile();

  const visibleButtons = buttons.filter((btn) => !isMobile || !btn.hideOnMobile);

  return (
    <div
      className={cn(
        'absolute left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-surface-secondary dark:border-border-dark dark:bg-surface-dark-secondary',
        LAYOUT_CLASSES.ACTIVITY_BAR_WIDTH,
      )}
    >
      {visibleButtons.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => setCurrentView(view)}
          className={cn(
            'group relative flex h-12 items-center justify-center border-l-2 transition-all duration-200',
            currentView === view
              ? 'border-brand-600 bg-surface text-brand-600 dark:border-brand-400 dark:bg-surface-dark dark:text-brand-400'
              : 'border-transparent text-text-tertiary hover:bg-surface-hover hover:text-text-primary dark:text-text-dark-tertiary dark:hover:bg-surface-dark-hover dark:hover:text-text-dark-primary',
          )}
          aria-label={`Switch to ${label.toLowerCase()} view`}
          aria-pressed={currentView === view}
          title={label}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

export { ActivityBar as ViewSwitcher };
