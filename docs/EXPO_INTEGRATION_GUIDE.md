# Guia de Integração: Expo com WebView para HealthCall Display

**Objetivo:** Construir uma aplicação móvel multiplataforma usando Expo que funcione como um invólucro (wrapper) para a aplicação web HealthCall. A aplicação usará um componente WebView para exibir o site e criará uma ponte de comunicação para permitir que a aplicação web utilize o motor de Text-to-Speech (TTS) nativo do dispositivo.

**Funcionalidades Críticas a Implementar:**
1.  **Wrapper WebView:** A aplicação Expo carregará a URL de produção do HealthCall Display em um WebView de tela cheia.
2.  **Login via Web:** O processo de login e gerenciamento de sessão será totalmente controlado pela aplicação web, exatamente como funciona em um navegador padrão.
3.  **Ponte para TTS Nativo:** A aplicação web, quando precisar anunciar uma chamada, enviará uma mensagem para o "invólucro" Expo. O Expo receberá essa mensagem e usará o `expo-speech` para executar a síntese de voz nativa, garantindo maior qualidade e confiabilidade.

---

## Visão Geral da Arquitetura de Integração

A comunicação entre a camada web (React, dentro do WebView) e a camada nativa (Expo, React Native) é o ponto central desta arquitetura.

1.  **Carregamento da Aplicação:**
    *   O aplicativo Expo contém um único componente principal: `WebView`, da biblioteca `react-native-webview`.
    *   Este `WebView` é configurado para carregar a URL da aplicação web (ex: `https://healthcall-23d13.web.app/display`).

2.  **Comunicação Web -> Nativo (Para o TTS):**
    *   A biblioteca `react-native-webview` injeta um objeto `window.ReactNativeWebView` no contexto JavaScript da página web carregada.
    *   O hook `useSpeechSynthesis` na aplicação **web** será modificado. Ele verificará a existência de `window.ReactNativeWebView`.
    *   Se o objeto existir, em vez de usar a API do navegador (`window.speechSynthesis`), o hook chamará `window.ReactNativeWebView.postMessage()`.
    *   A mensagem enviada será uma string JSON, por exemplo: `JSON.stringify({ type: 'speak', payload: { text: 'Paciente João, sala 2' } })`.

3.  **Execução Nativa (No Expo):**
    *   O componente `WebView` no aplicativo Expo possui um listener chamado `onMessage`.
    *   Esta função será acionada sempre que a aplicação web chamar `postMessage()`.
    *   O código do listener irá parsear a string JSON recebida, verificar se o `type` é `'speak'`, e então chamar a função `Speech.speak()` da biblioteca `expo-speech` com o texto recebido.

---

## Passo a Passo Detalhado para Implementação

### **Parte 1: Modificação na Aplicação Web (React)**

**Tarefa:** Atualizar o hook `useSpeechSynthesis` para se comunicar com o WebView.

1.  **Edite o `useSpeechSynthesis.ts`:**
    ```typescript
    // No projeto React (web)
    // src/hooks/useSpeechSynthesis.ts

    // Adicione uma interface para o objeto que será injetado pelo React Native
    interface ReactNativeWebView {
      postMessage(message: string): void;
    }
    
    // Adicione esta linha para ter acesso ao objeto injetado
    declare const window: Window & typeof globalThis & { ReactNativeWebView?: ReactNativeWebView };

    export const useSpeechSynthesis = () => {
      const speak = (text: string, lang = 'pt-BR') => {
        // Verifica se está rodando dentro de um WebView do React Native
        if (window.ReactNativeWebView) {
          console.log('Enviando mensagem para TTS Nativo via WebView');
          const message = JSON.stringify({
            type: 'speak',
            payload: { text, lang },
          });
          window.ReactNativeWebView.postMessage(message);
        } else if ('speechSynthesis' in window) {
          // Fallback para a API web padrão em navegadores
          console.log('Usando TTS da Web API');
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          window.speechSynthesis.speak(utterance);
        } else {
          console.error('TTS não é suportado neste ambiente.');
        }
      };

      return { speak };
    };
    ```
2.  **Faça o Deploy da sua Aplicação Web:** As alterações acima precisam estar em produção para que o aplicativo Expo possa carregá-las.

---

### **Parte 2: Construção da Aplicação Expo**

**Tarefa:** Criar o aplicativo Expo que servirá como wrapper.

1.  **Crie o Projeto Expo:**
    ```bash
    npx create-expo-app healthcall-webview-app
    cd healthcall-webview-app
    ```

2.  **Instale as Dependências:**
    ```bash
    npx expo install expo-speech react-native-webview
    ```

3.  **Implemente o Componente Principal (`App.tsx`):** Substitua o conteúdo do seu `App.tsx` pelo código abaixo. Ele configura o WebView e o listener de mensagens.

    ```tsx
    // no projeto Expo
    // App.tsx
    import React from 'react';
    import { StyleSheet, SafeAreaView, Platform } from 'react-native';
    import { WebView, WebViewMessageEvent } from 'react-native-webview';
    import * as Speech from 'expo-speech';

    // URL da sua aplicação web de display
    const WEB_APP_URL = 'https://healthcall-23d13.web.app/display';

    // Interface para a mensagem que esperamos receber da web
    interface WebViewMessage {
      type: 'speak';
      payload: {
        text: string;
        lang?: string;
      };
    }

    export default function App() {
      // Função que lida com as mensagens vindas do WebView
      const handleWebViewMessage = (event: WebViewMessageEvent) => {
        try {
          const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

          // Verifica se a mensagem é para falar
          if (message.type === 'speak' && message.payload?.text) {
            console.log(`Recebido comando para falar: "${message.payload.text}"`);
            Speech.speak(message.payload.text, {
              language: message.payload.lang || 'pt-BR',
            });
          }
        } catch (error) {
          console.error('Erro ao processar mensagem do WebView:', error);
        }
      };

      return (
        <SafeAreaView style={styles.container}>
          <WebView
            source={{ uri: WEB_APP_URL }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            // Essencial para áudio e outras APIs modernas funcionarem
            mediaPlaybackRequiresUserAction={false}
            // Habilita o DOM Storage para que o localStorage (usado pelo Supabase) funcione
            domStorageEnabled={true}
            // Habilita JavaScript
            javaScriptEnabled={true}
            // Para Android, ajuda a evitar problemas de renderização
            androidLayerType="hardware"
          />
        </SafeAreaView>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#000', // Fundo escuro para uma melhor aparência em TVs
      },
      webview: {
        flex: 1,
      },
    });
    ```

---

## Conclusão e Teste Final

**Teste de Aceitação Final:**
1.  Certifique-se de que a versão atualizada da sua aplicação web (com o `useSpeechSynthesis` modificado) está em produção.
2.  Inicie a aplicação Expo no seu dispositivo (`npx expo start` e escaneie o QR code com o app Expo Go).
3.  A aplicação deve carregar a interface web de login.
4.  Faça o login normalmente através da interface web.
5.  Após o login, a página de display será exibida.
6.  Use a aplicação de gerenciamento para chamar um paciente.
7.  A aplicação web enviará a mensagem para o Expo, e você deverá ouvir a chamada sendo anunciada pela voz nativa do seu dispositivo. O console do Expo deve exibir a mensagem "Recebido comando para falar...".

Esta arquitetura combina a flexibilidade de uma aplicação web com o poder dos recursos nativos do dispositivo, criando uma solução robusta e de fácil manutenção.