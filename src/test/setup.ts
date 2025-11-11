import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock do AudioContext global
class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running';

  async resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  async suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  async close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext as any;
(global as any).webkitAudioContext = MockAudioContext;

// Mock do HTMLAudioElement
class MockAudio {
  src: string = '';
  volume: number = 1.0;
  crossOrigin: string | null = null;
  preload: string = 'auto';
  onended: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onloadeddata: (() => void) | null = null;
  oncanplay: (() => void) | null = null;
  onprogress: (() => void) | null = null;
  onstalled: (() => void) | null = null;
  onwaiting: (() => void) | null = null;
  paused: boolean = true;

  constructor(src?: string) {
    if (src) {
      this.src = src;
    }
  }

  async play() {
    this.paused = false;
    // Simula reprodução bem-sucedida após delay
    setTimeout(() => {
      if (this.onended) {
        this.onended();
      }
    }, 10);
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  load() {
    // Mock do load - não faz nada
    if (this.onloadeddata) {
      this.onloadeddata();
    }
  }

  remove() {
    // Mock do remove - não faz nada
  }
}

global.Audio = MockAudio as any;

// Mock do fetch para verificação de cache
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response)
) as any;

// Mock do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
