# HealthCall - Chromecast Setup Guide

## 🎯 Status: Configuração Completa ✅

Seu aplicativo HealthCall já está registrado no Google Cast Console!

- **Application ID**: `A75B4462`
- **Application Name**: HealthCall
- **Status**: Published ✅

## 📋 Próximos Passos

### 1. Deploy do Receiver

O arquivo `receiver.html` precisa estar hospedado em HTTPS e ser a mesma URL registrada no Google Cast Console.

**Opções de Hospedagem:**

#### Opção A: Firebase Hosting (Recomendado)

```bash
# 1. Instalar Firebase CLI (se necessário)
npm install -g firebase-tools

# 2. Login no Firebase
firebase login

# 3. Inicializar projeto
firebase init hosting

# Configurações:
# - Usar projeto existente ou criar novo
# - Public directory: public
# - Single-page app: No
# - Automatic builds: No

# 4. Configurar firebase.json
# Adicionar rewrite para receiver
```

**firebase.json**:

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "/receiver.html",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          }
        ]
      }
    ]
  }
}
```

```bash
# 5. Deploy
firebase deploy --only hosting

# Anotar a URL do deploy (ex: https://healthcall-xxxxx.web.app)
```

#### Opção B: Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Criar vercel.json na raiz
```

**vercel.json**:

```json
{
  "headers": [
    {
      "source": "/receiver.html",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

```bash
# 3. Deploy
vercel --prod

# Anotar a URL do deploy
```

#### Opção C: GitHub Pages

```bash
# 1. Criar repositório no GitHub
# 2. Push da pasta public
# 3. Ativar GitHub Pages nas configurações
# 4. IMPORTANTE: GitHub Pages precisa de domínio custom para HTTPS
```

### 2. Atualizar URL no Google Cast Console

1. Acessar: https://cast.google.com/publish/
2. Localizar aplicação **HealthCall** (ID: A75B4462)
3. Clicar em **Edit**
4. Atualizar **Receiver Application URL** com a URL do deploy
   - Exemplo: `https://healthcall-xxxxx.web.app/receiver.html`
5. Salvar alterações

### 3. Testar Conexão

Após deploy e atualização da URL:

```bash
# 1. Rebuild da aplicação (configurações já atualizadas)
npm run build

# 2. Rodar localmente para teste
npm run dev

# 3. Abrir no Chrome
# http://localhost:5173

# 4. Verificar:
# - Botão de Cast aparece no header
# - Clicar no botão
# - Selecionar seu Chromecast
# - Chamar um paciente
# - Verificar exibição no Chromecast
```

## 🧪 Checklist de Teste

- [ ] Receiver deployado em HTTPS
- [ ] URL atualizada no Google Cast Console
- [ ] Aplicação principal rebuilded
- [ ] Botão Cast aparece no dashboard
- [ ] Consegue conectar ao Chromecast
- [ ] Chamada de paciente aparece no Chromecast
- [ ] Sino e TTS funcionam
- [ ] Avisos aparecem durante idle (se configurados)
- [ ] Manchetes de notícias aparecem (se configuradas)
- [ ] Ticker de notícias funciona

## 🎬 Como Usar

### Para Equipe de Saúde

1. **Abrir Dashboard**
   - Acessar HealthCall no navegador Chrome ou app Electron

2. **Conectar ao Chromecast**
   - Clicar no botão "Chromecast" no header
   - Selecionar o dispositivo Chromecast da sala
   - Aguardar conexão (ícone ficará verde)

3. **Gerenciar Fila Normalmente**
   - Adicionar pacientes como sempre
   - Chamar pacientes clicando em "Chamar"
   - **As chamadas aparecerão automaticamente na TV!**

4. **Desconectar (Opcional)**
   - Clicar novamente no botão (agora verde)
   - Ou usar menu do Chrome Cast

### Para TI/Administração

**Configurar Avisos:**

1. Ir para página "Avisos"
2. Criar avisos com texto, imagens/vídeos, QR codes
3. Programar horários (ex: 08:00-18:00)
4. Avisos aparecem automaticamente durante idle

**Configurar Notícias:**

1. Ir para "Configurações"
2. Configurar URL do RSS feed
3. Manchetes e ticker aparecem automaticamente

**Múltiplas Salas:**

- Cada sala pode ter seu próprio Chromecast
- Basta conectar ao Chromecast correto antes de iniciar atendimento

## 🔧 Troubleshooting

### Botão Cast não aparece

**Causa**: Cast SDK não carregou ou dispositivo não está na mesma rede

**Solução**:

```javascript
// Abrir console do navegador (F12)
console.log(window.cast); // Deve retornar objeto
```

- Se `undefined`: Verificar conexão internet e recarregar página
- Se existe: Verificar que Chromecast está na mesma rede WiFi

### Conexão falha

**Possíveis causas**:

1. Receiver URL incorreta no Cast Console
2. Receiver não está acessível publicamente
3. CORS não configurado
4. Cache do navegador

**Soluções**:

1. Verificar URL no Cast Console
2. Testar URL do receiver diretamente no navegador
3. Verificar headers CORS no servidor
4. Limpar cache do Chrome (Ctrl+Shift+Del)

### Receiver não exibe conteúdo

**Debug**:

```bash
# 1. Chrome no computador
chrome://inspect/#devices

# 2. Localizar seu Chromecast
# 3. Clicar em "inspect"
# 4. Ver console de erros
```

**Verificações**:

- Mensagens estão sendo enviadas? (log no sender)
- Mensagens estão sendo recebidas? (log no receiver)
- Namespace correto: `urn:x-cast:com.healthcall.display`

### Áudio não toca

**Causa**: Autoplay policies ou volume

**Solução**:

- Verificar volume do Chromecast
- Verificar que TV não está em mudo
- Reiniciar Chromecast

## 📊 Monitoramento

### Logs do Sender

```javascript
// Os logs aparecem no console do navegador
[Cast] Initializing...
[Cast] Framework initialized
[Cast] Session connected
[Cast] Sending patient call to receiver
```

### Logs do Receiver

```javascript
// Acessíveis via chrome://inspect/#devices
[Receiver] Message received: { type: 'PATIENT_CALL', data: {...} }
[Receiver] Patient call: João da Silva
[Audio] Playing bell...
[Audio] Speaking: Chamando João da Silva, para Consultório 1
```

## 🎨 Customização

### Alterar Nome da Facilidade

Editar `receiver.html`:

```html
<!-- Linha ~105, ~110, ~132 -->
<h1 class="facility-name">PSF Maria Lucia da Silva</h1>
```

Alterar para o nome da sua unidade de saúde.

### Alterar Cores

```html
<!-- No <style> do receiver.html -->
/* Cor primária (verde) */ color: #38e07b; /* Alterar para sua cor */ color:
#seu-codigo-hex;
```

### Logo Customizado

1. Substituir `/healthcall-logo-header.png`
2. Manter proporções (altura recomendada: 32-48px)
3. Formato PNG com fundo transparente

## 📞 Suporte

Para problemas técnicos:

1. Verificar console do navegador (F12)
2. Verificar console do receiver (chrome://inspect)
3. Consultar walkthrough completo em `/brain/walkthrough.md`

## ✅ Conclusão

Configuração completa! Seu HealthCall está pronto para usar Chromecast profissionalmente.

**Próximo passo imediato**: Fazer deploy do `receiver.html` e atualizar URL no Google Cast Console.

Boa sorte! 🚀
