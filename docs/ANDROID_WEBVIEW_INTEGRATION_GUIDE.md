# Guia de Integração: HealthCall Display com WebView Android (Kotlin)

Este guia detalha o processo para encapsular a página de display do HealthCall em um aplicativo Android nativo usando um WebView, com foco em duas funcionalidades críticas: **login automático** e **suporte a Text-to-Speech (TTS) nativo**.

## Visão Geral da Estratégia

A integração será feita de forma transparente para o usuário, eliminando a necessidade de interação manual com a tela de login na Android TV.

1.  **Login Automático via Injeção de Token**: O aplicativo Kotlin será responsável por autenticar-se diretamente com o Supabase usando as credenciais fornecidas. Após obter o token de sessão (JWT), ele o injetará no `localStorage` do WebView. Ao carregar a página, o cliente Supabase do lado da web encontrará o token e considerará a sessão como ativa, pulando a tela de login.
2.  **TTS Nativo via JavaScript Interface**: Criaremos uma "ponte" de comunicação entre o JavaScript do WebView e o código Kotlin. O código da web poderá detectar se está rodando dentro do nosso WebView e, em caso afirmativo, em vez de usar a API de TTS do navegador, ele chamará uma função nativa do Kotlin que utilizará o motor de TTS do Android.

---

## Passo 1: Configuração do Projeto Android (Kotlin)

### 1.1. Adicionar Dependências

No arquivo `build.gradle.kts` (ou `build.gradle`) do seu módulo do app, adicione a dependência do cliente Supabase para Kotlin e garanta que a permissão `INTERNET` seja solicitada no `AndroidManifest.xml`.

**`build.gradle.kts`**
```kotlin
dependencies {
    // ... outras dependências
    implementation("io.github.jan-tennert.supabase:gotrue-kt:2.3.3") // Para autenticação
    implementation("io.ktor:ktor-client-cio:2.3.10") // Engine HTTP para o Supabase
}
```

**`app/src/main/AndroidManifest.xml`**
```xml
<manifest ...>
    <uses-permission android:name="android.permission.INTERNET" />
    <application ...>
        ...
    </application>
</manifest>
```

### 1.2. Inicializar e Autenticar com Supabase

Crie um cliente Supabase e uma função para realizar o login. Isso pode ser feito na sua `MainActivity` ou em uma classe ViewModel.

```kotlin
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope

// ...

class MainActivity : AppCompatActivity() {

    private lateinit var supabaseClient: SupabaseClient
    private var sessionToken: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // ...

        // 1. Inicializa o cliente Supabase
        initializeSupabase()

        // 2. Realiza o login para obter o token
        // É crucial fazer isso fora da thread principal (UI)
        lifecycleScope.launch(Dispatchers.IO) {
            fetchSupabaseSession()
            
            // 3. Após obter o token, configure e carregue o WebView na thread principal
            withContext(Dispatchers.Main) {
                setupWebView()
            }
        }
    }

    private fun initializeSupabase() {
        supabaseClient = createSupabaseClient(
            supabaseUrl = "https://itxvexnhoafehwmlhulo.supabase.co",
            supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eHZleG5ob2FmZWh3bWxodWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTE5NjksImV4cCI6MjA3MzAyNzk2OX0.EZItfCLMovKUzEobllrVO314Vekx96fJ8mMrU09f1Tk"
        ) {
            install(GoTrue)
        }
    }

    private suspend fun fetchSupabaseSession() {
        try {
            // Autentica com as credenciais fornecidas
            val session = supabaseClient.auth.signInWith(Email) {
                email = "healthcalltv@adminhctv.com"
                password = "vunjat-Gaqsac-nozhy1"
            }
            sessionToken = session.accessToken
            Log.d("SupabaseAuth", "Login bem-sucedido, token obtido!")
        } catch (e: Exception) {
            Log.e("SupabaseAuth", "Falha no login: ${e.message}")
            // Tratar falha de login (ex: mostrar mensagem de erro, tentar novamente)
        }
    }
    
    // ... setupWebView() será definido no próximo passo
}
```

---

## Passo 2: Configuração do WebView e Injeção de Token

### 2.1. Configurar o WebView

Dentro da `MainActivity`, adicione a função `setupWebView`.

```kotlin
import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient

// ...

@SuppressLint("SetJavaScriptEnabled")
private fun setupWebView() {
    val myWebView: WebView = findViewById(R.id.webview) // Assumindo que você tem um WebView com este ID no seu layout

    myWebView.settings.javaScriptEnabled = true
    myWebView.settings.domStorageEnabled = true // Essencial para o localStorage

    // O WebViewClient é necessário para injetar o JavaScript antes da página carregar
    myWebView.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            
            // Somente injeta o token se ele foi obtido com sucesso
            sessionToken?.let { token ->
                // **AQUI ACONTECE A MÁGICA DO LOGIN AUTOMÁTICO**
                val script = """
                    localStorage.setItem('sb-itxvexnhoafehwmlhulo-auth-token', '$token');
                    console.log('Token do Supabase injetado com sucesso.');
                """.trimIndent()
                
                view?.evaluateJavascript(script, null)
            }
        }
    }
    
    // Adiciona a interface para o TTS (próximo passo)
    addTTSInterface(myWebView)

    // Carrega a URL final (substitua pela URL de produção/deploy do seu app)
    myWebView.loadUrl("https://healthcall-23d13.web.app/display")
}
```

---

## Passo 3: Integração com TTS Nativo do Android

### 3.1. Criar a Classe de Interface JavaScript

Esta classe conterá os métodos que o JavaScript poderá chamar. Ela também gerenciará a instância do `TextToSpeech` do Android.

```kotlin
import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import android.webkit.JavascriptInterface
import java.util.Locale

class WebAppInterface(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsInitialized = false

    init {
        tts = TextToSpeech(context, this)
    }

    // Método que será chamado pelo JavaScript
    @JavascriptInterface
    fun speak(text: String) {
        if (isTtsInitialized) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
            Log.d("WebAppInterface", "Falando: $text")
        } else {
            Log.e("WebAppInterface", "TTS não inicializado.")
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("pt", "BR"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("TTS", "Linguagem pt-BR não suportada.")
            } else {
                isTtsInitialized = true
            }
        } else {
            Log.e("TTS", "Falha na inicialização do TTS.")
        }
    }
    
    // Método para liberar os recursos do TTS quando a Activity for destruída
    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
    }
}
```

### 3.2. Registrar a Interface no WebView

Na `MainActivity`, crie a instância da interface e a adicione ao WebView.

```kotlin
// ... dentro da MainActivity

private lateinit var webAppInterface: WebAppInterface

private fun addTTSInterface(webView: WebView) {
    webAppInterface = WebAppInterface(this)
    // "AndroidTTS" é o nome que será usado no JavaScript para acessar a interface
    webView.addJavascriptInterface(webAppInterface, "AndroidTTS")
}

// Não se esqueça de liberar os recursos do TTS
override fun onDestroy() {
    super.onDestroy()
    if (::webAppInterface.isInitialized) {
        webAppInterface.shutdown()
    }
}
```

---

## Passo 4: Modificar o Código da Web (React)

Agora, ajuste o hook `useSpeechSynthesis.ts` para usar a interface nativa quando disponível.

**`src/hooks/useSpeechSynthesis.ts`**

```typescript
import { useEffect, useState } from 'react';

// Define a interface global para que o TypeScript reconheça nosso objeto injetado
declare global {
  interface Window {
    AndroidTTS?: {
      speak: (text: string) => void;
    };
  }
}

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const isAndroidWebView = !!window.AndroidTTS;

  useEffect(() => {
    // Se estiver no WebView, não precisa carregar vozes do navegador
    if (isAndroidWebView) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const ptBRVoice = availableVoices.find((voice) => voice.lang === 'pt-BR');
        setSelectedVoice(ptBRVoice || availableVoices[0]);
      }
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, [isAndroidWebView]);

  const speak = (text: string): Promise<void> => {
    // **AQUI ACONTECE A MÁGICA DO TTS**
    if (isAndroidWebView) {
      try {
        window.AndroidTTS?.speak(text);
        return Promise.resolve();
      } catch (e) {
        console.error("Erro ao chamar a interface nativa AndroidTTS", e);
        return Promise.reject(e);
      }
    }

    // Fallback para o navegador padrão
    return new Promise((resolve, reject) => {
      if (!selectedVoice) {
        console.warn('Nenhuma voz de síntese de fala selecionada.');
        return resolve();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(`Falha na síntese de fala: ${e.error}`));
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        resolve();
      }
    });
  };

  return { speak, voices, selectedVoice, setSelectedVoice, isAndroidWebView };
};

export default useSpeechSynthesis;
```

## Considerações de Segurança

Hardcoding (fixar no código) as credenciais de login é geralmente uma prática ruim. No entanto, para este caso de uso específico — um dispositivo de display controlado (Android TV) onde o aplicativo é o único usuário da conta de "display" — essa abordagem é um *trade-off* aceitável em nome da simplicidade e da experiência do usuário. **Nunca** use esta abordagem para credenciais de usuários finais.

## Conclusão

Seguindo estes passos, você terá um aplicativo Android que:
1.  Abre a página `/display` **sem nunca mostrar a tela de login**.
2.  Utiliza o motor de **TTS nativo do Android**, que geralmente oferece maior qualidade e melhor integração com o sistema operacional.
3.  Mantém a base de código da web praticamente inalterada, com uma modificação inteligente e isolada no hook `useSpeechSynthesis`.

Esta solução oferece uma integração robusta e profissional entre sua aplicação web React e a plataforma Android.