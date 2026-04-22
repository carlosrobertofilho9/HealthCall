import { useEffect } from 'react';

const MOBILE_SCROLL_QUERY = '(max-width: 1023px)';
const SCROLL_MODE_ATTRIBUTE = 'data-scroll-mode';
const KEYBOARD_OPEN_ATTRIBUTE = 'data-keyboard-open';
const VISUAL_VIEWPORT_HEIGHT_VAR = '--app-visual-viewport-height';
const LAYOUT_VIEWPORT_HEIGHT_VAR = '--app-layout-viewport-height';
const KEYBOARD_INSET_VAR = '--app-keyboard-inset';

const toPixelValue = (value: number) => `${Math.max(0, Math.round(value))}px`;

export function useAppViewport(): void {
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia(MOBILE_SCROLL_QUERY);
    let stableLayoutHeight = window.innerHeight || window.visualViewport?.height || 0;

    const updateScrollMode = () => {
      root.setAttribute(SCROLL_MODE_ATTRIBUTE, mediaQuery.matches ? 'document' : 'contained');
    };

    const updateViewportHeight = () => {
      const isMobile = mediaQuery.matches;
      const visualViewport = window.visualViewport;
      const visualHeight = visualViewport?.height ?? window.innerHeight;
      const offsetTop = visualViewport?.offsetTop ?? 0;
      const innerHeight = window.innerHeight || visualHeight;

      const previousStableHeight = stableLayoutHeight || innerHeight;
      const possibleKeyboardInset = Math.max(
        0,
        innerHeight - visualHeight - offsetTop,
        previousStableHeight - visualHeight - offsetTop,
      );
      const keyboardThreshold = Math.max(120, previousStableHeight * 0.15);
      const isKeyboardOpen = isMobile && possibleKeyboardInset > keyboardThreshold;

      if (!isMobile || !isKeyboardOpen) {
        stableLayoutHeight = innerHeight;
      } else {
        stableLayoutHeight = Math.max(stableLayoutHeight, innerHeight);
      }

      const layoutHeight = isMobile ? stableLayoutHeight : visualHeight;
      const keyboardInset = isKeyboardOpen
        ? Math.max(0, stableLayoutHeight - visualHeight - offsetTop)
        : 0;

      root.style.setProperty(VISUAL_VIEWPORT_HEIGHT_VAR, toPixelValue(visualHeight));
      root.style.setProperty(LAYOUT_VIEWPORT_HEIGHT_VAR, toPixelValue(layoutHeight));
      root.style.setProperty(KEYBOARD_INSET_VAR, toPixelValue(keyboardInset));

      if (isKeyboardOpen) {
        root.setAttribute(KEYBOARD_OPEN_ATTRIBUTE, 'true');
      } else {
        root.removeAttribute(KEYBOARD_OPEN_ATTRIBUTE);
      }
    };

    const update = () => {
      updateScrollMode();
      updateViewportHeight();
    };

    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
    } else {
      mediaQuery.addListener(update);
    }

    window.visualViewport?.addEventListener('resize', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      root.removeAttribute(SCROLL_MODE_ATTRIBUTE);
      root.removeAttribute(KEYBOARD_OPEN_ATTRIBUTE);
      root.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_VAR);
      root.style.removeProperty(LAYOUT_VIEWPORT_HEIGHT_VAR);
      root.style.removeProperty(KEYBOARD_INSET_VAR);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', update);
      } else {
        mediaQuery.removeListener(update);
      }

      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);
}
