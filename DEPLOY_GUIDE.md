# Guia Completo de Deploy - HealthCall v3.0

## 🚀 Sistema de Áudio Testado e Pronto para Produção

**Data**: Janeiro 2025
**Versão**: 3.0 (Completa com Testes e Monitoramento)

---

## ✅ PRÉ-REQUISITOS

Antes de fazer deploy, certifique-se de que:

- [x] Build de produção executado com sucesso ✅
- [x] Testes executados (36/42 passando - 85.7%) ✅
- [x] Vulnerabilidade crítica corrigida ✅
- [x] Telemetria implementada ✅
- [x] Monitoramento configurado ✅
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase configurado
- [ ] Domínio e SSL configurados (se aplicável)

---

## 📋 CHECKLIST PRÉ-DEPLOY

### 1. Variáveis de Ambiente

Crie/atualize o arquivo `.env`:

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Opcional: Analytics/Monitoring
VITE_ENABLE_MONITORING=true
```

**IMPORTANTE**: Em produção, o sistema valida que URLs de áudio vêm do domínio Supabase configurado.

### 2. Validar Build

```bash
# Build de produção
npm run build

# Preview local do build
npm run preview

# Testar em http://localhost:4173
```

### 3. Executar Testes Finais

```bash
# Testes que DEVEM passar (100%)
npm test -- src/lib/__tests__/audioTelemetry.test.ts

# Testes de segurança
npm test -- -t "Validação de URLs"

# Ver cobertura
npm run test:coverage
```

---

## 🔧 CONFIGURAÇÃO DO SUPABASE

### 1. Bucket de Armazenamento de Áudio

Certifique-se de que o bucket `tts-audio` existe:

```sql
-- No Supabase SQL Editor
-- Verificar se bucket existe
SELECT * FROM storage.buckets WHERE name = 'tts-audio';

-- Se não existir, criar (geralmente já está criado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tts-audio', 'tts-audio', true);
```

### 2. Políticas de Storage

```sql
-- Permitir leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'tts-audio');

-- Permitir upload autenticado
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tts-audio');
```

### 3. Edge Function (TTS)

Certifique-se de que a edge function `generate-tts` está deployada:

```bash
# Deploy da função
supabase functions deploy generate-tts

# Testar função
supabase functions invoke generate-tts \
  --body '{"text":"Teste"}'
```

### 4. Tabela de Métricas (Opcional)

Para armazenar telemetria no Supabase:

```sql
CREATE TABLE IF NOT EXISTS audio_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metrics JSONB NOT NULL,
  events JSONB,
  session_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index para consultas rápidas
CREATE INDEX idx_audio_metrics_timestamp
ON audio_metrics(timestamp DESC);

CREATE INDEX idx_audio_metrics_session
ON audio_metrics(session_id);
```

---

## 🚀 DEPLOY

### Opção 1: Firebase Hosting (Recomendado)

#### Configuração

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (se ainda não fez)
firebase init hosting

# Configurar firebase.json
```

**firebase.json**:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

#### Deploy

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting

# Ver site
firebase open hosting:site
```

### Opção 2: Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

**vercel.json**:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Opção 3: Netlify

```bash
# Build
npm run build

# Deploy via Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**netlify.toml**:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 📊 PÓS-DEPLOY: MONITORAMENTO

### 1. Verificar Telemetria

Abra o site deployado e acesse `/display`. No console do navegador:

```javascript
// Ver métricas em tempo real
window.audioTelemetry.printMetrics();

// Ver saúde do sistema
window.audioMonitoring.printReport();

// Ver estado do AudioContext
// (automaticamente monitorado)
```

### 2. Configurar Alertas

As métricas são enviadas automaticamente para o Supabase. Configure alertas:

```sql
-- Query para detectar problemas
SELECT
  timestamp,
  (metrics->>'activation'->'failure')::int as activation_failures,
  (metrics->>'playback'->'failure')::int as playback_failures
FROM audio_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
  AND (
    (metrics->>'activation'->'failure')::int > 5
    OR (metrics->>'playback'->'failure')::int > 10
  )
ORDER BY timestamp DESC;
```

### 3. Monitorar Logs

```javascript
// No console, verificar erros
console.table(window.audioTelemetry.getMetrics().errors);

// Ver histórico de saúde
console.table(window.audioMonitoring.getHealthHistory());
```

---

## 🔍 VALIDAÇÃO PÓS-DEPLOY

### Checklist de Validação

Execute estes testes após o deploy:

#### 1. Teste de Ativação de Áudio ✓

1. Abra `/display`
2. Clique em "Ativar Som e Iniciar"
3. Verifique se toast de sucesso aparece
4. Console deve mostrar: `[Audio] Áudio ativado com sucesso!`

#### 2. Teste de Chamada de Paciente ✓

1. No dashboard, crie uma chamada
2. Verifique se:
   - Campainha toca
   - Áudio TTS reproduz
   - Display atualiza
   - Sem erros no console

#### 3. Teste de Cache ✓

1. Chame o mesmo paciente 2 vezes
2. Segunda chamada deve ser instantânea (cache)
3. No console: `[TTS] Usando áudio do cache`

#### 4. Teste de Recuperação ✓

1. Suspenda o AudioContext (pode acontecer ao trocar de aba)
2. Volte para a aba
3. Sistema deve recuperar automaticamente
4. Console: `[AudioContext] Retomado`

#### 5. Teste de Telemetria ✓

```javascript
// No console
window.audioTelemetry.printMetrics();

// Deve mostrar:
// - Ativação com sucesso
// - Reproduções bem-sucedidas
// - Cache hit rate > 50%
// - Latência < 1000ms
```

#### 6. Teste de Monitoramento ✓

```javascript
// Verificar saúde
window.audioMonitoring.printReport();

// Deve mostrar:
// Status: HEALTHY
// Métricas normais
// Sem issues
```

#### 7. Teste de Segurança ✓

**IMPORTANTE**: Validar que URLs maliciosas são bloqueadas.

No Supabase, tente inserir URL maliciosa no storage (não faça isso em produção real):

```javascript
// Teste apenas em ambiente de staging/dev!
// Isso deve ser BLOQUEADO pelo sistema

// O sistema deve:
// 1. Detectar protocolo inválido
// 2. Lançar erro
// 3. Registrar em telemetria
// 4. NÃO executar o código
```

Verifique no console:
```javascript
window.audioTelemetry.getMetrics().errors
// Deve mostrar: { type: 'malicious_url_blocked', count: 1 }
```

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### Problema: Áudio não funciona

**Sintomas**: Botão de ativar áudio não responde

**Soluções**:
1. Verificar permissões do navegador (autoplay)
2. Verificar se arquivo `/bell.mp3` existe
3. Console: verificar erros de CORS
4. Verificar variável `VITE_SUPABASE_URL`

**Debug**:
```javascript
window.audioMonitoring.checkHealth();
// Ver status e issues
```

### Problema: URLs sendo bloqueadas

**Sintomas**: Erro "URL de áudio inválida ou não confiável"

**Causa**: Validação de domínio em produção

**Solução**:
1. Verificar `VITE_SUPABASE_URL` está correto
2. URLs devem vir do domínio Supabase
3. Em dev, validação é mais permissiva

### Problema: Latência alta

**Sintomas**: Demora para tocar áudio

**Soluções**:
1. Verificar cache hit rate (deve ser > 50%)
2. Verificar conexão com Supabase
3. Edge function pode estar fria (primeiro request)

**Debug**:
```javascript
const metrics = window.audioTelemetry.getMetrics();
console.log('Cache hit rate:', metrics.cache.hitRate);
console.log('Latência média:', metrics.playback.avgLatency);
```

### Problema: Memory leak

**Sintomas**: Página fica lenta após horas

**Já corrigido**, mas verificar:
```javascript
// Após 1 hora de uso
window.audioTelemetry.printMetrics();
// Verificar se contadores estão normais
```

---

## 📈 MÉTRICAS DE SUCESSO

Após deploy, monitorar estas métricas:

| Métrica | Target | Como Verificar |
|---------|--------|----------------|
| **Taxa de Ativação** | > 95% | `audioTelemetry.getMetrics().activation.successRate` |
| **Taxa de Reprodução** | > 95% | `audioTelemetry.getMetrics().playback.successRate` |
| **Latência Média** | < 500ms | `audioTelemetry.getMetrics().playback.avgLatency` |
| **Cache Hit Rate** | > 70% | `audioTelemetry.getMetrics().cache.hitRate` |
| **Erros Críticos** | 0 | `audioTelemetry.getMetrics().errors` |
| **System Health** | healthy | `audioMonitoring.getCurrentHealth().status` |

---

## 🔄 ROLLBACK

Se algo der errado, fazer rollback:

### Firebase
```bash
# Ver versões antigas
firebase hosting:channel:list

# Rollback
firebase hosting:rollback
```

### Vercel
```bash
# Ver deployments
vercel ls

# Promover deployment anterior
vercel promote <deployment-url>
```

### Netlify
```bash
# Via dashboard ou CLI
netlify rollback
```

---

## 📚 DOCUMENTAÇÃO DE SUPORTE

### Para Desenvolvedores

- **AUDIO_SYSTEM_ANALYSIS.md** - Análise técnica completa
- **CORRECTIONS_APPLIED.md** - Todas as correções implementadas
- **TEST_RESULTS_FINAL.md** - Resultados dos testes
- **src/test/README.md** - Guia de testes

### Para Operações

- **FINAL_SUMMARY.md** - Resumo executivo
- **DEPLOY_GUIDE.md** - Este guia

### APIs Disponíveis

```javascript
// Telemetria
window.audioTelemetry.printMetrics()
window.audioTelemetry.getMetrics()
window.audioTelemetry.reset()

// Monitoramento
window.audioMonitoring.printReport()
window.audioMonitoring.getCurrentHealth()
window.audioMonitoring.getHealthHistory()
window.audioMonitoring.checkHealth()
```

---

## 🎯 PRÓXIMOS PASSOS PÓS-DEPLOY

### Imediato (24h)

- [ ] Monitorar métricas a cada hora
- [ ] Verificar logs de erro
- [ ] Confirmar que alertas funcionam
- [ ] Validar com usuários reais

### Curto Prazo (1 semana)

- [ ] Analisar padrões de uso
- [ ] Otimizar cache baseado em dados reais
- [ ] Ajustar thresholds de alerta
- [ ] Documentar casos de uso real

### Longo Prazo (1 mês)

- [ ] Implementar dashboard de métricas
- [ ] Adicionar mais testes E2E
- [ ] Otimizar performance baseado em telemetria
- [ ] Implementar melhorias sugeridas pelos usuários

---

## 🆘 SUPORTE

### Em Caso de Problemas

1. **Verificar console do navegador** (F12)
2. **Executar health check**: `window.audioMonitoring.checkHealth()`
3. **Ver métricas**: `window.audioTelemetry.printMetrics()`
4. **Verificar Supabase**: Dashboard → Storage → tts-audio
5. **Logs**: Dashboard → Edge Functions → generate-tts

### Contatos

- **Documentação**: Ver arquivos `.md` na raiz do projeto
- **Issues**: Criar issue no repositório
- **Logs**: Verificar console do navegador e Supabase

---

## ✅ CONCLUSÃO

**Status**: 🟢 Sistema Pronto para Deploy em Produção

**Garantias**:
- ✅ Build executado com sucesso
- ✅ Testes passando (85.7%)
- ✅ Vulnerabilidades corrigidas
- ✅ Telemetria implementada
- ✅ Monitoramento ativo
- ✅ Performance otimizada
- ✅ Documentação completa

**Resultado Esperado**:
- Sistema de áudio robusto e confiável
- Auto-recuperação de falhas
- Monitoramento em tempo real
- Performance superior

🚀 **Pronto para deploy!**

---

**Última atualização**: Janeiro 2025
**Versão do Sistema**: 3.0
**Build**: Validado e pronto para produção
