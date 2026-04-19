import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS } from './design-system';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs />');
  }
  return context;
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const Tabs = ({ value, onValueChange, className, children, ...props }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'relative inline-flex items-center border p-1 shadow-sm gap-1',
        DS_COLOR.surface.card,
        DS_RADIUS.pill,
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, onClick, type, children, ...props }, ref) => {
    const { value: currentValue, onValueChange } = useTabsContext();
    const isActive = currentValue === value;

    return (
      <motion.button
        ref={ref}
        type={type ?? 'button'}
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer',
          DS_RADIUS.pill,
          !isActive && 'text-muted-foreground hover:text-foreground hover:bg-secondary/40',
          isActive && 'text-primary-foreground',
          className,
        )}
        onClick={(event) => {
          onValueChange(value);
          onClick?.(event);
        }}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className={cn('absolute inset-0 z-0 bg-primary shadow-md', DS_RADIUS.pill)}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
          />
        )}
      </motion.button>
    );
  },
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { value: currentValue } = useTabsContext();
    const isActive = currentValue === value;

    return (
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={value}
            ref={ref}
            role="tabpanel"
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn('outline-none py-4', className)}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };

