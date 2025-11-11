# Guia de Testes - Sistema de Áudio HealthCall

## 🚀 Começando

### Instalação

Instale as dependências de teste:

```bash
npm install
```

As seguintes dependências foram adicionadas:
- `vitest` - Framework de testes
- `@testing-library/react` - Utilitários para testar React
- `@testing-library/jest-dom` - Matchers customizados do Jest
- `jsdom` - Ambiente DOM para Node.js
- `@vitest/ui` - Interface visual para testes

### Executando Testes

```bash
# Executa todos os testes
npm test

# Modo watch (re-executa ao salvar arquivos)
npm test -- --watch

# Interface visual
npm run test:ui

# Gera relatório de cobertura
npm run test:coverage
```

## 📁 Estrutura de Testes

```
src/
├── test/
│   ├── setup.ts                    # Configuração global de testes
│   └── README.md                   # Este arquivo
├── hooks/
│   ├── useTextToSpeech.ts
│   └── __tests__/
│       └── useTextToSpeech.test.ts # Testes do hook TTS
└── features/
    └── display/
        └── hooks/
            ├── useDisplay.ts
            └── __tests__/
                └── useDisplay.test.ts # Testes do hook Display
```

## 🧪 Tipos de Testes

### 1. Testes Unitários - `useTextToSpeech`

**Localização**: `src/hooks/__tests__/useTextToSpeech.test.ts`

**Cobertura** (27 testes):
- ✅ Cache e expiração de URLs
- ✅ Retry logic com exponential backoff
- ✅ Cleanup de listeners de áudio
- ✅ Remoção de cache corrompido
- ✅ Cenários de stress (múltiplas chamadas, textos longos)
- ✅ Validação de segurança (XSS, URLs maliciosas)

**Exemplo de execução**:
```bash
npm test useTextToSpeech
```

### 2. Testes de Integração - `useDisplay`

**Localização**: `src/features/display/hooks/__tests__/useDisplay.test.ts`

**Cobertura** (14 testes):
- ✅ AudioContext singleton pattern
- ✅ Sistema de mutex para evitar race conditions
- ✅ Detecção de chamadas duplicadas
- ✅ Gerenciamento de subscriptions Supabase
- ✅ Memory leak prevention
- ✅ Validação de segurança

**Exemplo de execução**:
```bash
npm test useDisplay
```

## 🎭 Mocks e Configuração

### Setup Global (`src/test/setup.ts`)

O arquivo de setup configura:

1. **Mock do AudioContext**:
   ```typescript
   class MockAudioContext {
     state: 'running' | 'suspended' | 'closed' = 'running';
     async resume() { ... }
   }
   ```

2. **Mock do HTMLAudioElement**:
   ```typescript
   class MockAudio {
     async play() { ... }
     pause() { ... }
   }
   ```

3. **Cleanup automático** após cada teste

4. **Console silenciado** para reduzir ruído nos logs

### Mocks Personalizados

Cada arquivo de teste define seus próprios mocks:

```typescript
// Mock do Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { id: '123' } },
  })),
}));
```

## 📊 Relatório de Cobertura

Após executar `npm run test:coverage`, você verá um relatório como:

```
File                           | % Stmts | % Branch | % Funcs | % Lines
-------------------------------|---------|----------|---------|--------
useTextToSpeech.ts            |   95.2  |   88.9   |   100   |  94.7
useDisplay.ts                 |   87.3  |   76.5   |   85.7  |  86.9
```

O relatório HTML estará disponível em `coverage/index.html`.

## ✅ Boas Práticas Implementadas

### 1. Arrange-Act-Assert (AAA)

```typescript
it('deve fazer cache de URLs geradas', async () => {
  // Arrange
  const mockUrl = 'https://example.com/audio.mp3';
  vi.mocked(supabase.functions.invoke).mockResolvedValue({
    data: { speechUrl: mockUrl },
  });

  // Act
  const { result } = renderHook(() => useTextToSpeech());
  const url = await result.current.preloadTTS('teste');

  // Assert
  expect(url).toBe(mockUrl);
  expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
});
```

### 2. Testes Descritivos

```typescript
describe('useTextToSpeech', () => {
  describe('preloadTTS', () => {
    it('deve fazer cache de URLs geradas', async () => { ... });
    it('deve fazer retry em caso de falha', async () => { ... });
    it('deve expirar cache após 1 hora', async () => { ... });
  });
});
```

### 3. Cleanup Adequado

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset de estado
});

afterEach(() => {
  cleanup();
  // Limpa timers se usou fake timers
  vi.useRealTimers();
});
```

### 4. Testes Assíncronos

```typescript
it('deve reproduzir áudio com sucesso', async () => {
  await expect(result.current.speak('teste')).resolves.not.toThrow();
});

// Ou com waitFor
await waitFor(() => {
  expect(mockSpeak).toHaveBeenCalledTimes(1);
});
```

## 🐛 Debugging de Testes

### Modo Verbose

```bash
npm test -- --reporter=verbose
```

### Executar Teste Específico

```bash
npm test -- useTextToSpeech.test.ts -t "deve fazer cache"
```

### UI Mode (Recomendado)

```bash
npm run test:ui
```

Abre uma interface visual onde você pode:
- Ver testes em tempo real
- Debugar com console.log
- Ver coverage inline
- Filtrar e executar testes específicos

### Debug no VSCode

Adicione ao `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 🔍 Cenários de Teste Importantes

### 1. Race Conditions

```typescript
it('deve bloquear múltiplas reproduções simultâneas', async () => {
  // Dispara 2 chamadas ao mesmo tempo
  const promise1 = playBellAndSpeak(patient1);
  const promise2 = playBellAndSpeak(patient2);

  await Promise.all([promise1, promise2]);

  // Apenas uma deve ter executado
  expect(mockSpeak).toHaveBeenCalledTimes(1);
});
```

### 2. Memory Leaks

```typescript
it('deve limpar subscription ao desmontar', () => {
  const { unmount } = renderHook(() => useDisplay());

  unmount();

  expect(supabase.removeChannel).toHaveBeenCalled();
});
```

### 3. Segurança

```typescript
it('não deve permitir injection via nome do paciente', async () => {
  const maliciousPatient = {
    name: '<script>alert("XSS")</script>',
  };

  // Deve processar como texto, não executar
  await playBellAndSpeak(maliciousPatient);

  expect(mockSpeak).toHaveBeenCalledWith(
    expect.stringContaining('<script>')
  );
});
```

## 📚 Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎯 Próximos Passos

1. **Aumentar Cobertura**: Meta de >90%
2. **Testes E2E**: Adicionar com Playwright
3. **Visual Regression**: Testes de screenshot
4. **Performance Testing**: Benchmarks automatizados

## 💡 Dicas

- Execute testes antes de commit: `git hooks`
- Mantenha testes rápidos (<1s por teste)
- Use `it.only()` para focar em um teste
- Use `it.skip()` para temporariamente desabilitar
- Prefira `waitFor` em vez de `setTimeout`

## 🤝 Contribuindo

Ao adicionar novos recursos:

1. Escreva testes primeiro (TDD)
2. Mantenha >80% de cobertura
3. Documente casos edge
4. Adicione testes de segurança se aplicável

---

**Última atualização**: Janeiro 2025
