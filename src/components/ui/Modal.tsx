import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

type ModalPosition = 'center' | 'bottom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelRef?: React.Ref<HTMLDivElement>;
  position?: ModalPosition;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  showMobileHandle?: boolean;
  overlayClassName?: string;
  panelClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  panelRef,
  position = 'center',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showMobileHandle = false,
  overlayClassName,
  panelClassName,
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeOnEsc, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const baseOverlayClassName =
    position === 'bottom'
      ? 'fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4'
      : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm';

  const basePanelClassName =
    position === 'bottom'
      ? 'w-full rounded-t-3xl border border-border bg-card safe-area-bottom sm:max-w-md sm:rounded-2xl'
      : 'w-full rounded-2xl border border-border bg-card';

  return (
    <div
      className={cn(baseOverlayClassName, overlayClassName)}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(basePanelClassName, panelClassName)}
        onClick={(event) => event.stopPropagation()}
      >
        {showMobileHandle && <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />}
        {children}
      </div>
    </div>
  );
};

export default Modal;