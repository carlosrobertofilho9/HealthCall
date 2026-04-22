import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppViewport } from '../useAppViewport';

type Listener = (event: Event) => void;

const Harness = () => {
  useAppViewport();
  return null;
};

const root = () => document.documentElement;

const setInnerHeight = (height: number) => {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
};

const installMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const installVisualViewport = (height: number, offsetTop = 0) => {
  const listeners = new Map<string, Set<Listener>>();
  const viewport = {
    height,
    offsetTop,
    addEventListener: vi.fn((type: string, listener: Listener) => {
      const registered = listeners.get(type) ?? new Set<Listener>();
      registered.add(listener);
      listeners.set(type, registered);
    }),
    removeEventListener: vi.fn((type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    }),
  };

  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });

  return {
    viewport,
    fireResize: () => {
      listeners.get('resize')?.forEach((listener) => listener(new Event('resize')));
    },
  };
};

describe('useAppViewport', () => {
  beforeEach(() => {
    installMatchMedia(true);
    setInnerHeight(800);
  });

  afterEach(() => {
    root().removeAttribute('data-scroll-mode');
    root().removeAttribute('data-keyboard-open');
    root().style.removeProperty('--app-visual-viewport-height');
    root().style.removeProperty('--app-layout-viewport-height');
    root().style.removeProperty('--app-keyboard-inset');
  });

  it('sets stable viewport variables without keyboard', () => {
    installVisualViewport(800);

    const { unmount } = render(<Harness />);

    expect(root()).toHaveAttribute('data-scroll-mode', 'document');
    expect(root().style.getPropertyValue('--app-visual-viewport-height')).toBe('800px');
    expect(root().style.getPropertyValue('--app-layout-viewport-height')).toBe('800px');
    expect(root().style.getPropertyValue('--app-keyboard-inset')).toBe('0px');
    expect(root()).not.toHaveAttribute('data-keyboard-open');

    unmount();

    expect(root().style.getPropertyValue('--app-layout-viewport-height')).toBe('');
  });

  it('keeps layout height stable and exposes keyboard inset', () => {
    const visualViewport = installVisualViewport(800);
    render(<Harness />);

    act(() => {
      visualViewport.viewport.height = 500;
      visualViewport.fireResize();
    });

    expect(root().style.getPropertyValue('--app-visual-viewport-height')).toBe('500px');
    expect(root().style.getPropertyValue('--app-layout-viewport-height')).toBe('800px');
    expect(root().style.getPropertyValue('--app-keyboard-inset')).toBe('300px');
    expect(root()).toHaveAttribute('data-keyboard-open', 'true');
  });
});
