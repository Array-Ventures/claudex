import { memo, ReactNode } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { useDropdown } from '@/hooks/useDropdown';
import { Button, SelectItem } from '@/components/ui';

export type DropdownItemType<T> = { type: 'item'; data: T } | { type: 'header'; label: string };

export interface DropdownProps<T> {
  value: T;
  items: readonly T[] | readonly DropdownItemType<T>[];
  getItemKey: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemShortLabel?: (item: T) => string;
  onSelect: (item: T) => void;
  renderItem?: (item: T, isSelected: boolean) => ReactNode;
  leftIcon?: LucideIcon;
  width?: string;
  itemClassName?: string;
  dropdownPosition?: 'top' | 'bottom';
  disabled?: boolean;
  compactOnMobile?: boolean;
}

const isGroupedItems = <T,>(
  items: readonly T[] | readonly DropdownItemType<T>[],
): items is readonly DropdownItemType<T>[] => {
  return (
    items.length > 0 && typeof items[0] === 'object' && items[0] !== null && 'type' in items[0]
  );
};

function DropdownInner<T>({
  value,
  items,
  getItemKey,
  getItemLabel,
  getItemShortLabel,
  onSelect,
  renderItem,
  leftIcon: LeftIcon,
  width = 'w-40',
  itemClassName,
  dropdownPosition = 'bottom',
  disabled = false,
  compactOnMobile = false,
}: DropdownProps<T>) {
  const { isOpen, dropdownRef, setIsOpen } = useDropdown();

  const showIconOnly = compactOnMobile && LeftIcon;
  const labelClasses = showIconOnly
    ? 'hidden sm:inline whitespace-nowrap text-xs font-medium text-text-primary dark:text-text-dark-secondary'
    : 'whitespace-nowrap text-xs font-medium text-text-primary dark:text-text-dark-secondary';
  const chevronClasses = showIconOnly
    ? 'hidden sm:block h-3.5 w-3.5 flex-shrink-0 text-text-quaternary'
    : 'h-3.5 w-3.5 flex-shrink-0 text-text-quaternary';

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        variant="unstyled"
        className={`flex items-center gap-1 rounded-lg border border-border/70 bg-surface-secondary px-2 py-1 shadow-sm hover:border-border-secondary hover:shadow-md dark:border-white/5 dark:bg-surface-dark-secondary dark:hover:border-white/10 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <div className={`flex items-center ${LeftIcon ? 'gap-1.5' : 'gap-2'}`}>
          {LeftIcon && <LeftIcon className="h-3.5 w-3.5 text-text-quaternary" />}
          <span className={labelClasses}>
            {getItemShortLabel ? getItemShortLabel(value) : getItemLabel(value)}
          </span>
          {!disabled && (
            <ChevronDown className={`${chevronClasses} ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </Button>

      {isOpen && !disabled && (
        <div
          className={`absolute left-0 ${width} z-[60] rounded-2xl border border-border/50 bg-surface/95 shadow-2xl shadow-black/10 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-surface-dark/95 dark:shadow-black/40 ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          <div className="space-y-1 p-2">
            {isGroupedItems(items)
              ? items.map((item, index) => {
                  if (item.type === 'header') {
                    return (
                      <div
                        key={`header-${item.label}`}
                        className={`border-t border-border/30 px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-wider text-text-tertiary dark:border-white/5 dark:text-text-dark-tertiary ${index === 0 ? 'border-t-0' : 'mt-1'}`}
                      >
                        {item.label}
                      </div>
                    );
                  }

                  const isSelected = getItemKey(item.data) === getItemKey(value);
                  return (
                    <SelectItem
                      key={getItemKey(item.data)}
                      isSelected={isSelected}
                      onSelect={() => {
                        onSelect(item.data);
                        setIsOpen(false);
                      }}
                      className={itemClassName || 'flex items-center gap-2.5 pl-3'}
                    >
                      {renderItem ? (
                        renderItem(item.data, isSelected)
                      ) : (
                        <span
                          className={`text-xs font-medium ${
                            isSelected
                              ? 'text-text-primary dark:text-text-dark-primary'
                              : 'text-text-primary dark:text-text-dark-secondary'
                          }`}
                        >
                          {getItemLabel(item.data)}
                        </span>
                      )}
                    </SelectItem>
                  );
                })
              : items.map((item) => {
                  const isSelected = getItemKey(item) === getItemKey(value);
                  return (
                    <SelectItem
                      key={getItemKey(item)}
                      isSelected={isSelected}
                      onSelect={() => {
                        onSelect(item);
                        setIsOpen(false);
                      }}
                      className={itemClassName || 'flex items-center gap-2.5'}
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <span
                          className={`text-xs font-medium ${
                            isSelected
                              ? 'text-text-primary dark:text-text-dark-primary'
                              : 'text-text-primary dark:text-text-dark-secondary'
                          }`}
                        >
                          {getItemLabel(item)}
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
          </div>
        </div>
      )}
    </div>
  );
}

export const Dropdown = memo(DropdownInner) as <T>(props: DropdownProps<T>) => JSX.Element;
