# Plano de Implementação: Suporte ao Chromecast para HealthCall

## Visão Geral

Integrar o HealthCall com o Chromecast é uma excelente ideia para ampliar a usabilidade da página de display. O maior desafio, como intuído, é a funcionalidade de Text-to-Speech (TTS), pois o ambiente de um Chromecast (Cast Application Framework - CAF) não suporta a API de Síntese de Voz do navegador (`window.speechSynthesis`).

Para resolver isso, a melhor abordagem é **gerar o áudio da chamada no servidor** e enviá-lo para o Chromecast como um arquivo de mídia para ser reproduzido. O Chromecast é, em sua essência, um reprodutor de mídia, então essa abordagem utiliza seu ponto forte.

Este documento detalha o plano de implementação.

---

### **Arquitetura da Solução**

A arquitetura será dividida em três partes principais:

1.  **Aplicação "Sender" (Remetente):** Nossa aplicação React (`DisplayPage.tsx`) que irá iniciar e controlar a transmissão.
2.  **Aplicação "Receiver" (Receptor):** Um novo e simples aplicativo web que será carregado no Chromecast.
3.  **Função Serverless para TTS:** Um endpoint (Supabase Edge Function) que converte texto em áudio e o armazena para reprodução.

---

### **Fase 1: Configurar o Google Cast SDK na Aplicação (Sender)**

O primeiro passo é adicionar o botão "Transmitir" e a lógica para gerenciar a sessão de cast na sua página de display.

#### 1. Carregar o Script do Google Cast

Adicione o script da API do Google Cast ao seu `public/index.html`. Isso tornará a API de transmissão disponível globalmente na sua aplicação.

```html
<!-- public/index.html -->
<script defer src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

#### 2. Criar um Componente "CastButton"

Crie um novo componente React que irá inicializar o contexto de cast e renderizar o botão de transmissão fornecido pelo Google.

**`src/components/CastButton/CastButton.tsx`**
```tsx
import React, { useEffect } from 'react';

// Este ID será fornecido ao registrar o seu app receiver
const APPLICATION_ID = 'YOUR_CHROMECAST_APP_ID'; 

const CastButton: React.FC = () => {
  useEffect(() => {
    // Inicializa o contexto do Cast com o ID da nossa aplicação receiver
    window.cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: APPLICATION_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
  }, []);

  // O elemento <google-cast-launcher> é um componente web fornecido
  // pelo script do Google Cast. Ele renderiza o ícone de transmissão
  // e gerencia a conexão ao ser clicado.
  return (
    <google-cast-launcher
      style={{ width: '24px', height: '24px', cursor: 'pointer' }}
    />
  );
};

export default CastButton;
```

#### 3. Adicionar o Botão à `DisplayPage.tsx`

Integre o `CastButton` no cabeçalho da sua página de display para que o usuário possa iniciar a transmissão.

```tsx
// Em src/pages/Display/DisplayPage.tsx
// ...
import CastButton from '@/components/CastButton/CastButton';

// Dentro do JSX do cabeçalho:
<header className="px-6 py-4 flex items-center justify-between ...">
  {/* ... outros elementos do cabeçalho ... */}
  <div className="flex items-center gap-4">
    <CastButton />
    {/* ... */}
  </div>
</header>
// ...
```

---

### **Fase 2: Criar a Aplicação "Receiver"**

Esta é a página web que o Chromecast irá carregar. Ela precisa ser extremamente simples e focada em receber comandos e reproduzir mídia.

#### 1. Registrar uma Aplicação no Google Cast SDK Developer Console

1.  Acesse o [Google Cast SDK Developer Console](https://cast.google.com/publish).
2.  Pague a taxa de registro única (se ainda não o fez).
3.  Crie uma nova **"Custom Receiver Application"**.
4.  **URL do Receiver:** Aponte para uma nova página que você irá hospedar. Como você usa Firebase Hosting, pode ser `https://healthcall-23d13.web.app/receiver.html`.
5.  Após o registro, você receberá um **`APPLICATION_ID`**. Use-o na variável `APPLICATION_ID` do `CastButton.tsx`.

#### 2. Criar o arquivo `receiver.html`

Crie este arquivo na sua pasta `public` para que seja implantado junto com o resto do aplicativo.

**`public/receiver.html`**
```html
<!DOCTYPE html>
<html>
<head>
  <title>HealthCall Display</title>
  <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
</head>
<body style="background-color: #111827; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
  
  <!-- O player de mídia padrão do Chromecast -->
  <cast-media-player></cast-media-player>

  <script>
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();
    
    // Namespace customizado para nossa comunicação. Deve ser o mesmo no sender.
    const CUSTOM_NAMESPACE = 'urn:x-cast:com.example.healthcall';

    context.addCustomMessageListener(CUSTOM_NAMESPACE, (event) => {
      const { type, payload } = event.data;

      if (type === 'PLAY_CALL_AUDIO') {
        // Cria objetos de mídia para a campainha e para a fala
        const bellSound = new cast.framework.messages.MediaInformation();
        bellSound.contentUrl = payload.bell; // URL pública para o bell.mp3
        bellSound.contentType = 'audio/mp3';

        const speechSound = new cast.framework.messages.MediaInformation();
        speechSound.contentUrl = payload.speech; // URL pública para o áudio gerado
        speechSound.contentType = 'audio/mpeg';

        const bellRequest = new cast.framework.messages.LoadRequest(bellSound);
        
        // Carrega e toca a campainha primeiro.
        playerManager.load(bellRequest).then(() => {
          // Quando o carregamento da campainha estiver concluído,
          // adicionamos a fala à fila para tocar em seguida.
          const speechQueueItem = new cast.framework.messages.QueueItem(speechSound);
          playerManager.getQueueManager().insertItems([speechQueueItem]);
        });
      }
    });

    // Inicia o contexto do receiver
    context.start();
  </script>
</body>
</html>
```

---

### **Fase 3: Criar a Função Serverless para TTS (Lógica Corrigida)**

Usaremos uma Supabase Edge Function. Ela receberá um texto, gerará o áudio, **o salvará no Supabase Storage** e retornará a URL pública para o áudio.

> **Nota Importante:** A abordagem de salvar o áudio é crucial porque o Chromecast não consegue acessar `blob:` URLs geradas localmente no navegador do sender. O áudio precisa estar em uma URL pública e acessível pela internet.

1.  **Crie a Edge Function:**
    Ex: `supabase/functions/generate-tts/index.ts`.

    ```typescript
    // supabase/functions/generate-tts/index.ts
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
    import { crypto } from "https://deno.land/std@0.159.0/crypto/mod.ts";

    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');
    const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`;
    const STORAGE_BUCKET = 'tts-audio'; // Crie este bucket no seu Supabase

    serve(async (req) => {
      const { text } = await req.json();
      if (!text) return new Response('Missing text', { status: 400 });

      // Crie um hash do texto para usar como nome de arquivo (cache)
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const fileName = `${hash}.mp3`;

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Verifica se o arquivo já existe no Storage
      const { data: existingFile } = await supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
      if (!existingFile.error) {
          return new Response(JSON.stringify({ speechUrl: existingFile.publicUrl }), {
              headers: { 'Content-Type': 'application/json' },
          });
      }

      // Se não existe, gera o áudio
      const ttsResponse = await fetch(TTS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-B' },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });
      if (!ttsResponse.ok) throw new Error(await ttsResponse.text());

      const { audioContent } = await ttsResponse.json();
      const audioBuffer = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));

      // Salva o novo áudio no Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

      if (uploadError) throw uploadError;

      // Retorna a URL pública do arquivo recém-criado
      const { data: publicUrlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

      return new Response(JSON.stringify({ speechUrl: publicUrlData.publicUrl }), {
        headers: { 'Content-Type': 'application/json' },
      });
    });
    ```
    **Ações necessárias:**
    *   Crie um bucket no Supabase Storage chamado `tts-audio` e defina suas políticas para permitir leitura pública.
    *   Adicione as variáveis de ambiente `GOOGLE_TTS_API_KEY`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` como segredos na sua função Supabase.

---

### **Fase 4: Conectar Tudo na `DisplayPage.tsx` (Lógica Corrigida)**

Modifique a `DisplayPage.tsx` para chamar a função serverless e enviar a URL pública para o receiver.

**`src/pages/Display/DisplayPage.tsx`**
```tsx
// ...

const DisplayPage: React.FC = () => {
  // ...

  const playBellAndSpeak = async (patient: Patient) => {
    const castSession = window.cast.framework.CastContext.getInstance().getCurrentSession();

    // Se houver uma sessão de cast ativa, use a nova lógica
    if (castSession) {
      try {
        // 1. Chame sua função serverless para gerar/obter o áudio
        const ttsResponse = await fetch(
          'YOUR_SUPABASE_FUNCTION_URL/generate-tts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `Chamando ${patient.name}, para ${patient.destination}` }),
          }
        );

        if (!ttsResponse.ok) throw new Error('Failed to generate TTS audio.');

        const { speechUrl } = await ttsResponse.json();

        // 2. Envie a mensagem para o receiver com as URLs públicas
        const CUSTOM_NAMESPACE = 'urn:x-cast:com.example.healthcall';
        castSession.sendMessage(CUSTOM_NAMESPACE, {
          type: 'PLAY_CALL_AUDIO',
          payload: {
            bell: new URL('/bell.mp3', window.location.origin).href, // URL absoluta e pública
            speech: speechUrl, // URL pública retornada pela função
          },
        });

      } catch (error) {
        console.error('Failed to send message to Chromecast:', error);
        // Considere um fallback para o áudio local se a transmissão falhar
      }
    } else {
      // Lógica original de TTS para quando não estiver transmitindo
      // ... (seu código existente)
    }
  };

  // ... resto do componente
};
```

### **Resumo do Fluxo Final**

1.  O usuário clica no ícone do Chromecast na `DisplayPage`.
2.  A `receiver.html` é carregada no dispositivo Chromecast.
3.  Quando uma nova chamada de paciente é detectada na `DisplayPage`:
4.  A `DisplayPage` verifica se uma sessão de cast está ativa.
5.  Se estiver, ela chama a função `generate-tts`.
6.  A função `generate-tts` verifica se o áudio para aquele texto já existe no Storage. Se sim, retorna a URL pública. Se não, gera o áudio, salva no Storage e retorna a URL pública.
7.  A `DisplayPage` envia uma mensagem para o `receiver.html` com a URL pública da campainha e a URL pública do áudio da fala.
8.  O `receiver.html` no Chromecast recebe a mensagem e reproduz os dois áudios em sequência.

Este plano cria uma solução robusta que contorna as limitações do ambiente do Chromecast, garantindo que a funcionalidade principal do seu aplicativo funcione perfeitamente em uma tela de TV.
