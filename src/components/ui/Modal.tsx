import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS, DS_RADIUS_VARIANT } from './design-system';

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
      ? cn('fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm sm:items-center sm:p-4', DS_COLOR.overlay.strong)
      : cn('fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm', DS_COLOR.overlay.default);

  const basePanelClassName =
    position === 'bottom'
      ? cn('w-full border safe-area-bottom sm:max-w-md', DS_COLOR.surface.card, DS_RADIUS.surfaceTop, DS_RADIUS_VARIANT.smSurface)
      : cn('w-full border', DS_COLOR.surface.card, DS_RADIUS.surface);

  const modal = (
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
        {showMobileHandle && <div className={cn('mx-auto mb-3 h-1.5 w-12 sm:hidden', DS_COLOR.overlay.handle, DS_RADIUS.pill)} />}
        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default Modal;
