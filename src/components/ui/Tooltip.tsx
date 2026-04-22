import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: TooltipSide;
  className?: string;
  contentClassName?: string;
}

type TooltipPosition = {
  left: number;
  top: number;
  side: TooltipSide;
};

const OPPOSITE_SIDE: Record<TooltipSide, TooltipSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const FALLBACK_SIDES: TooltipSide[] = ['top', 'bottom', 'right', 'left'];

const getSideOrder = (preferredSide: TooltipSide) => {
  const order = [preferredSide, OPPOSITE_SIDE[preferredSide], ...FALLBACK_SIDES];
  return order.filter((side, index) => order.indexOf(side) === index);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getCandidatePosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  side: TooltipSide,
  gap: number,
) => {
  const centerX = triggerRect.left + triggerRect.width / 2;
  const centerY = triggerRect.top + triggerRect.height / 2;

  if (side === 'top') {
    return {
      left: centerX - tooltipRect.width / 2,
      top: triggerRect.top - tooltipRect.height - gap,
    };
  }

  if (side === 'bottom') {
    return {
      left: centerX - tooltipRect.width / 2,
      top: triggerRect.bottom + gap,
    };
  }

  if (side === 'left') {
    return {
      left: triggerRect.left - tooltipRect.width - gap,
      top: centerY - tooltipRect.height / 2,
    };
  }

  return {
    left: triggerRect.right + gap,
    top: centerY - tooltipRect.height / 2,
  };
};

const getOverflowScore = (left: number, top: number, tooltipRect: DOMRect, margin: number) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    Math.max(0, margin - left) +
    Math.max(0, margin - top) +
    Math.max(0, left + tooltipRect.width - (width - margin)) +
    Math.max(0, top + tooltipRect.height - (height - margin))
  );
};

export function Tooltip({ children, content, side = 'top', className, contentClassName }: TooltipProps) {
  const tooltipId = React.useId();
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const tooltipRef = React.useRef<HTMLSpanElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<TooltipPosition | null>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 12;
    const gap = 8;
    const sideOrder = getSideOrder(side);

    let best = {
      side: sideOrder[0],
      left: 0,
      top: 0,
      score: Number.POSITIVE_INFINITY,
    };

    for (const candidateSide of sideOrder) {
      const candidate = getCandidatePosition(triggerRect, tooltipRect, candidateSide, gap);
      const score = getOverflowScore(candidate.left, candidate.top, tooltipRect, margin);

      if (score === 0) {
        best = { ...candidate, side: candidateSide, score };
        break;
      }

      if (score < best.score) {
        best = { ...candidate, side: candidateSide, score };
      }
    }

    setPosition({
      side: best.side,
      left: clamp(best.left, margin, window.innerWidth - tooltipRect.width - margin),
      top: clamp(best.top, margin, window.innerHeight - tooltipRect.height - margin),
    });
  }, [side]);

  React.useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
    rafRef.current = window.requestAnimationFrame(updatePosition);

    const handleViewportChange = () => updatePosition();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  const openTooltip = () => setIsOpen(true);
  const closeTooltip = () => {
    setIsOpen(false);
    setPosition(null);
  };

  const child = React.cloneElement(children, {
    'aria-describedby': isOpen ? tooltipId : undefined,
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('relative inline-flex', className)}
        onPointerEnter={openTooltip}
        onPointerLeave={closeTooltip}
        onFocusCapture={openTooltip}
        onBlurCapture={closeTooltip}
      >
        {child}
      </span>

      {isOpen &&
        createPortal(
          <span
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            data-side={position?.side ?? side}
            className={cn(
              'pointer-events-none fixed z-[9999] w-max max-w-64 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity duration-100 ease-out',
              position && 'opacity-100',
              contentClassName,
            )}
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
