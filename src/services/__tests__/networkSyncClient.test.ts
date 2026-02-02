import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkSyncClient } from '@/services/networkSyncClient';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  triggerError() {
    this.onerror?.(new Event('error'));
  }
}

const createStatusResponse = () => ({
  success: true,
  server: 'HealthCall Sync Server',
  version: '1.0.0',
  clients: 1,
  addresses: [],
  timestamp: Date.now(),
});

describe('NetworkSyncClient', () => {
  let client: NetworkSyncClient;

  beforeEach(() => {
    client = new NetworkSyncClient();
    MockWebSocket.instances = [];
    vi.useFakeTimers();
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    if (typeof window !== 'undefined') {
      window.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    }
    if (!AbortSignal.timeout) {
      (AbortSignal as typeof AbortSignal & { timeout?: (ms: number) => AbortSignal }).timeout = () =>
        new AbortController().signal;
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('conecta e desconecta corretamente (ligado/desligado, conectado/desconectado)', async () => {
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();
    const onConnectedEvent = vi.fn();

    vi.spyOn(client, 'getServerStatus').mockResolvedValue(createStatusResponse());

    client.on('connected', onConnectedEvent);

    const connectPromise = client.connect({
      serverUrl: 'http://localhost:3457',
      autoReconnect: true,
      reconnectInterval: 5000,
      onConnect,
      onDisconnect,
    });

    await Promise.resolve();
    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();

    await expect(connectPromise).resolves.toBe(true);
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onConnectedEvent).toHaveBeenCalledTimes(1);
    expect(client.isConnected()).toBe(true);

    client.disconnect();
    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(client.isConnected()).toBe(false);

    vi.advanceTimersByTime(5000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('recebe atualizações de pacientes e avisos vindos de outro computador', async () => {
    const onDataUpdate = vi.fn();
    const dataUpdateListener = vi.fn();

    vi.spyOn(client, 'getServerStatus').mockResolvedValue(createStatusResponse());

    client.on('data_update', dataUpdateListener);

    const connectPromise = client.connect({
      serverUrl: 'http://localhost:3457',
      onDataUpdate,
    });

    await Promise.resolve();
    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();
    await connectPromise;

    ws.triggerMessage({
      type: 'data_update',
      table: 'patients',
      action: 'insert',
      data: { id: 'p1', name: 'Paciente A' },
      timestamp: Date.now(),
    });

    ws.triggerMessage({
      type: 'data_update',
      table: 'warnings',
      action: 'insert',
      data: { id: 'w1', message: 'Aviso importante' },
      timestamp: Date.now(),
    });

    expect(onDataUpdate).toHaveBeenCalledTimes(2);
    expect(dataUpdateListener).toHaveBeenCalledTimes(2);
  });

  it('processa sincronização completa e alterações de clientes', async () => {
    const fullSyncListener = vi.fn();
    const clientsChangedListener = vi.fn();

    vi.spyOn(client, 'getServerStatus').mockResolvedValue(createStatusResponse());

    client.on('full_sync', fullSyncListener);
    client.on('clients_changed', clientsChangedListener);

    const connectPromise = client.connect({
      serverUrl: 'http://localhost:3457',
    });

    await Promise.resolve();
    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();
    await connectPromise;

    ws.triggerMessage({
      type: 'full_sync',
      timestamp: Date.now(),
      data: { patients: [], warnings: [] },
    });

    ws.triggerMessage({
      type: 'client_joined',
      timestamp: Date.now(),
      clients: 2,
    });

    ws.triggerMessage({
      type: 'client_left',
      timestamp: Date.now(),
      clients: 1,
    });

    expect(fullSyncListener).toHaveBeenCalledTimes(1);
    expect(clientsChangedListener).toHaveBeenCalledTimes(2);
  });

  it('envia requisições REST para adicionar paciente e aviso', async () => {
    const patientResponse = {
      success: true,
      data: { id: 'p2', name: 'Paciente B', destination: 'Sala 1' },
    };
    const warningResponse = {
      success: true,
      data: { id: 'w2', message: 'Aviso externo' },
    };

    global.fetch = vi.fn().mockImplementation((url: RequestInfo, options?: RequestInit) => {
      if (url.toString().endsWith('/api/patients')) {
        return Promise.resolve({
          json: vi.fn().mockResolvedValue(patientResponse),
        }) as Promise<Response>;
      }
      if (url.toString().endsWith('/api/warnings')) {
        return Promise.resolve({
          json: vi.fn().mockResolvedValue(warningResponse),
        }) as Promise<Response>;
      }
      return Promise.resolve({
        json: vi.fn().mockResolvedValue({ success: true, data: {} }),
      }) as Promise<Response>;
    }) as typeof fetch;

    (client as NetworkSyncClient & { config?: { serverUrl: string } }).config = {
      serverUrl: 'http://localhost:3457',
    };

    const patient = await client.addPatient('Paciente B', 'Sala 1');
    const warning = await client.addWarning({ message: 'Aviso externo' });

    expect(patient).toEqual(patientResponse.data);
    expect(warning).toEqual(warningResponse.data);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3457/api/patients',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Paciente B', destination: 'Sala 1' }),
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3457/api/warnings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Aviso externo' }),
      })
    );
  });
});
