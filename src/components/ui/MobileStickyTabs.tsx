import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MobileStickyTabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface MobileStickyTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  items: readonly MobileStickyTabItem[];
  ariaLabel?: string;
}

const assertItemsLength = (items: readonly MobileStickyTabItem[]) => {
  if (items.length < 1 || items.length > 5) {
    throw new Error('MobileStickyTabs supports between 1 and 5 options.');
  }
};

const MobileStickyTabs = React.forwardRef<HTMLDivElement, MobileStickyTabsProps>(
  ({ value, onValueChange, items, ariaLabel = 'Navegação da seção', className, ...props }, ref) => {
    assertItemsLength(items);

    return (
      <div
        ref={ref}
        className={cn(
          'app-mobile-tabs-anchor shrink-0 lg:hidden',
          className,
        )}
        {...props}
      >
        <div
          className="app-mobile-sticky-tabs fixed inset-x-0 z-[39] border-b border-[#DCE5EE] bg-white/95 px-3 shadow-[0_12px_30px_rgba(0,27,61,0.06)] backdrop-blur-xl transition-all duration-200"
        >
          <div
            role="tablist"
            aria-label={ariaLabel}
            className="mx-auto grid w-full max-w-xl min-w-0 gap-1.5"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {items.map((item) => {
              const isActive = value === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={item.ariaLabel}
                  data-state={isActive ? 'active' : 'inactive'}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      onValueChange(item.value);
                    }
                  }}
                  className={cn(
                    'app-mobile-sticky-tab inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-black uppercase tracking-wide outline-none transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 disabled:cursor-not-allowed disabled:opacity-45 sm:text-xs',
                    isActive
                      ? 'border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65] shadow-[0_10px_22px_rgba(0,187,148,0.12)]'
                      : 'border-transparent bg-[#F8FAFC] text-[#64748B] hover:border-[#D5E6FF] hover:bg-white hover:text-[#001B3D]',
                  )}
                >
                  {item.icon ? <span className="flex h-4 w-4 shrink-0 items-center justify-center">{item.icon}</span> : null}
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-0.5 inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-black text-[#001B3D]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);
MobileStickyTabs.displayName = 'MobileStickyTabs';

export { MobileStickyTabs };
