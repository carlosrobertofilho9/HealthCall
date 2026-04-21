import { useEffect } from 'react';

const MOBILE_SCROLL_QUERY = '(max-width: 1023px)';
const SCROLL_MODE_ATTRIBUTE = 'data-scroll-mode';
const VISUAL_VIEWPORT_HEIGHT_VAR = '--app-visual-viewport-height';

export function useAppViewport(): void {
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia(MOBILE_SCROLL_QUERY);

    const updateScrollMode = () => {
      root.setAttribute(SCROLL_MODE_ATTRIBUTE, mediaQuery.matches ? 'document' : 'contained');
    };

    const updateViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty(VISUAL_VIEWPORT_HEIGHT_VAR, `${height}px`);
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
      root.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_VAR);

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
