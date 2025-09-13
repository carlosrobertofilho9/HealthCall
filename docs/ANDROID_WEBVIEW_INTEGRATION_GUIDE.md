# Guia de Construção para IA: WebView Android para HealthCall Display

**Objetivo:** Construir um aplicativo Android nativo (em Kotlin) que funcione como um invólucro (wrapper) para a aplicação web React "HealthCall". O foco é a página de display (`/display`), que será exibida em uma Android TV.

**Funcionalidades Críticas a Implementar:**
1.  **Login Automático e Transparente:** O usuário final nunca deve ver uma tela de login. O aplicativo nativo será responsável por autenticar-se e passar a sessão para a aplicação web.
2.  **Text-to-Speech (TTS) Nativo:** As chamadas de voz (anúncios de pacientes) devem usar o motor de TTS nativo do Android para garantir alta qualidade e confiabilidade, em vez da API de síntese de voz do navegador.

---

## Visão Geral da Arquitetura de Integração

Antes de começar, é crucial entender como as partes nativa (Kotlin) e web (React) se comunicarão.

1.  **Para o Login Automático:**
    *   O aplicativo Kotlin conterá as credenciais de login para uma conta de serviço específica do display.
    *   Ao iniciar, o app Kotlin se autenticará diretamente com o Supabase (nosso backend) e obterá um token de sessão (JWT).
    *   Este token será injetado no `localStorage` do WebView antes que a página web termine de carregar.
    *   O cliente Supabase na aplicação React é projetado para verificar o `localStorage` em busca de um token válido. Ao encontrá-lo, ele considerará a sessão autenticada, pulando completamente a tela de login. A chave exata do `localStorage` é `sb-itxvexnhoafehwmlhulo-auth-token`.

2.  **Para o TTS Nativo:**
    *   Criaremos uma "ponte" de comunicação usando a funcionalidade `JavascriptInterface` do Android.
    *   Uma classe Kotlin será exposta ao ambiente JavaScript do WebView sob um nome global (ex: `AndroidTTS`).
    *   Esta classe terá um método público, `speak(text: String)`, que o JavaScript poderá invocar.
    *   A aplicação React (especificamente o hook `useSpeechSynthesis`) já foi modificada para detectar a presença do objeto `window.AndroidTTS`. Se ele existir, em vez de usar a API `window.speechSynthesis` do navegador, ele chamará `window.AndroidTTS.speak(text)`.
    *   A implementação Kotlin desse método usará o motor `TextToSpeech` nativo do Android para vocalizar o texto recebido.

---

## Passo a Passo Detalhado para Implementação

Siga cada passo rigorosamente. Realize as verificações ao final de cada etapa para garantir que a base para o próximo passo está sólida.

### **Passo 1: Configuração Inicial do Projeto Android**

**Tarefa:** Prepare o ambiente do projeto Android.

1.  **Crie o Projeto:** Inicie um novo projeto no Android Studio.
    *   **Template:** "Empty Views Activity"
    *   **Linguagem:** Kotlin
    *   **Minimum SDK:** API 26 ou superior (para compatibilidade com Android TV).
2.  **Adicione Permissões:** O aplicativo precisa de acesso à internet para carregar a página web e autenticar-se.
    *   Abra o arquivo `app/src/main/AndroidManifest.xml`.
    *   Adicione a seguinte linha dentro da tag `<manifest>`:
        ```xml
        <uses-permission android:name="android.permission.INTERNET" />
        ```
3.  **Adicione Dependências:** Precisamos de bibliotecas para autenticação com Supabase e para realizar as chamadas de rede.
    *   Abra o arquivo `build.gradle.kts` (nível do módulo `app`).
    *   Adicione as seguintes implementações ao bloco `dependencies`:
        ```kotlin
        // BOM (Bill of Materials) do Supabase para gerenciar as versões
        val supabaseVersion = "3.2.3"
        implementation(platform("io.github.jan-tennert.supabase:bom:$supabaseVersion"))

        // Módulo de autenticação do Supabase
        implementation("io.github.jan-tennert.supabase:auth-kt")
        
        // Engine Ktor para as chamadas HTTP. Use uma versão compatível com o Supabase-kt 3.x
        val ktorVersion = "3.0.0-beta-1" // Verifique a versão mais recente compatível
        implementation("io.ktor:ktor-client-cio:$ktorVersion") 
        ```
4.  **Adicione o WebView ao Layout:**
    *   Abra o arquivo `app/src/main/res/layout/activity_main.xml`.
    *   Adicione um `WebView` que ocupe a tela inteira.
        ```xml
        <?xml version="1.0" encoding="utf-8"?>
        <androidx.constraintlayout.widget.ConstraintLayout 
            xmlns:android="http://schemas.android.com/apk/res/android"
            xmlns:app="http://schemas.android.com/apk/res-auto"
            xmlns:tools="http://schemas.android.com/tools"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            tools:context=".MainActivity">

            <WebView
                android:id="@+id/webview"
                android:layout_width="0dp"
                android:layout_height="0dp"
                app:layout_constraintBottom_toBottomOf="parent"
                app:layout_constraintEnd_toEndOf="parent"
                app:layout_constraintStart_toStartOf="parent"
                app:layout_constraintTop_toTopOf="parent" />

        </androidx.constraintlayout.widget.ConstraintLayout>
        ```

**✅ Verificação do Passo 1:**
*   Sincronize o Gradle. O projeto deve compilar e construir sem erros.
*   Execute o aplicativo em um emulador ou dispositivo. Ele deve exibir uma tela em branco, o que é esperado.

---

### **Passo 2: Implementação da Autenticação Supabase**

**Tarefa:** Autenticar com o Supabase no lado nativo para obter o token de sessão.

1.  **Orquestre a Lógica na `MainActivity`:** A `MainActivity` coordenará a inicialização, o login e a configuração do WebView.
    *   Abra `MainActivity.kt`.
    *   Adicione as propriedades para o cliente Supabase e o token.
        ```kotlin
        private lateinit var supabaseClient: SupabaseClient
        private var sessionJson: String? = null
        ```
    *   Modifique o método `onCreate` para orquestrar as chamadas na ordem correta, usando coroutines para as operações de rede.
        ```kotlin
        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            setContentView(R.layout.activity_main)

            // 1. Inicializa o cliente Supabase
            initializeSupabase()

            // 2. Lança uma coroutine para realizar o login em background
            lifecycleScope.launch(Dispatchers.IO) {
                fetchSupabaseSession()
                
                // 3. Após obter o token, volta para a thread principal para configurar o WebView
                withContext(Dispatchers.Main) {
                    setupWebView()
                }
            }
        }
        ```
2.  **Implemente a Inicialização do Cliente:** Crie a função que configura o cliente Supabase com as credenciais do projeto.
    ```kotlin
    private fun initializeSupabase() {
        supabaseClient = createSupabaseClient(
            supabaseUrl = "https://itxvexnhoafehwmlhulo.supabase.co",
            supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eHZleG5ob2FmZWh3bWxodWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTE5NjksImV4cCI6MjA3MzAyNzk2OX0.EZItfCLMovKUzEobllrVO314Vekx96fJ8mMrU09f1Tk"
        ) {
            install(Auth)
        }
    }
    ```
    // Adicione estas importações no início do seu arquivo MainActivity.kt
    import io.github.jan.supabase.gotrue.auth.providers.builtin.Email
    import io.github.jan.supabase.gotrue.auth.signInWith
    import kotlinx.serialization.json.Json
    import kotlinx.serialization.encodeToString

    // ...

3.  **Implemente a Função de Login:** Crie a função `suspend` que realiza o login e armazena a sessão como uma string JSON.
    ```kotlin
    private suspend fun fetchSupabaseSession() {
        try {
            // Autentica com as credenciais de serviço do display
            val session = supabaseClient.auth.signInWith(Email) {
                email = "healthcalltv@adminhctv.com"
                password = "vunjat-Gaqsac-nozhy1"
            }
            // A biblioteca JS espera o objeto de sessão completo, não apenas o token.
            // Serializamos o objeto de sessão para uma string JSON.
            sessionJson = Json.encodeToString(session)
            Log.d("SupabaseAuth", "Login bem-sucedido! Objeto de sessão serializado.")
        } catch (e: Exception) {
            Log.e("SupabaseAuth", "Falha no login do Supabase: ${e.message}", e)
            // Ação recomendada: Implementar uma política de retry ou exibir um estado de erro no WebView.
        }
    }
    ```

**✅ Verificação do Passo 2:**
*   Execute o aplicativo.
*   Abra o Logcat no Android Studio e filtre pela tag `SupabaseAuth`.
*   Você deve ver a mensagem "Login bem-sucedido! Objeto de sessão serializado.". Se vir uma falha, verifique a conexão com a internet e as credenciais.

---

### **Passo 3: Configuração do WebView e Injeção do Token**

**Tarefa:** Configurar o WebView para executar JavaScript, injetar o token de login e carregar a página.

1.  **Implemente `setupWebView`:** Crie a função que será chamada após o login bem-sucedido.
    ```kotlin
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val myWebView: WebView = findViewById(R.id.webview)

        // Habilitar JavaScript e DOM Storage é essencial
        myWebView.settings.javaScriptEnabled = true
        myWebView.settings.domStorageEnabled = true // Para que o localStorage funcione

        // O WebViewClient nos permite interceptar eventos de carregamento da página
        myWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                
                sessionJson?.let { session ->
                    // **INJEÇÃO DA SESSÃO**
                    // A chave do localStorage é `sb-PROJECT_REF-auth-token`.
                    // O valor deve ser a string JSON completa da sessão, que já foi serializada.
                    val script = "localStorage.setItem('sb-itxvexnhoafehwmlhulo-auth-token', '${session}'); console.log('Sessão do Supabase injetada via WebView.');"
                    
                    view?.evaluateJavascript(script, null)
                }
            }
        }
        
        // Adiciona a interface para o TTS (será criada no próximo passo)
        addTTSInterface(myWebView)

        // Carrega a URL de produção da aplicação React
        myWebView.loadUrl("https://healthcall-23d13.web.app/display")
    }
    ```
    

**✅ Verificação do Passo 3:**
*   Execute o aplicativo. A página de display do HealthCall deve carregar.
*   **Crucial:** A página **não deve** redirecionar para a tela de login. Ela deve ir direto para a fila de pacientes (mesmo que vazia).
*   Para uma verificação mais profunda, conecte o Chrome DevTools ao WebView do emulador/dispositivo (`chrome://inspect`), vá até a aba "Application", selecione "Local Storage" e confirme que a chave `sb-itxvexnhoafehwmlhulo-auth-token` existe e contém um valor.

---

### **Passo 4: Criação da Ponte TTS Nativa**

**Tarefa:** Criar a classe Kotlin que expõe a funcionalidade de TTS nativo ao JavaScript.

1.  **Crie a Classe `WebAppInterface`:** Crie um novo arquivo Kotlin chamado `WebAppInterface.kt`.
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
            // Inicia o motor TTS assim que a classe é instanciada
            tts = TextToSpeech(context, this)
        }

        // Este é o método que o JavaScript chamará
        @JavascriptInterface
        fun speak(text: String) {
            if (isTtsInitialized) {
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
                Log.d("WebAppInterface", "TTS Nativo falando: $text")
            } else {
                Log.e("WebAppInterface", "Comando 'speak' recebido, mas o TTS não está inicializado.")
            }
        }

        // Callback chamado quando o motor TTS está pronto
        override fun onInit(status: Int) {
            if (status == TextToSpeech.SUCCESS) {
                // Configura a linguagem para Português do Brasil
                val result = tts?.setLanguage(Locale("pt", "BR"))
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e("TTS", "Erro: Linguagem pt-BR não é suportada neste dispositivo.")
                } else {
                    isTtsInitialized = true
                    Log.i("TTS", "Motor TTS inicializado com sucesso em pt-BR.")
                }
            } else {
                Log.e("TTS", "Falha na inicialização do motor TTS.")
            }
        }
        
        // Método para liberar recursos quando a Activity for destruída
        fun shutdown() {
            tts?.stop()
            tts?.shutdown()
            Log.i("TTS", "Motor TTS desligado.")
        }
    }
    ```
2.  **Registre a Interface no WebView:** Volte para `MainActivity.kt`.
    *   Declare uma propriedade para a interface.
        ```kotlin
        private lateinit var webAppInterface: WebAppInterface
        ```
    *   Crie a função `addTTSInterface` e chame-a de dentro de `setupWebView`.
        ```kotlin
        private fun addTTSInterface(webView: WebView) {
            webAppInterface = WebAppInterface(this)
            // "AndroidTTS" é o nome do objeto global que será criado no `window` do JavaScript
            webView.addJavascriptInterface(webAppInterface, "AndroidTTS")
        }
        ```
    *   **Importante:** Libere os recursos do TTS para evitar vazamentos de memória.
        ```kotlin
        override fun onDestroy() {
            super.onDestroy()
            if (::webAppInterface.isInitialized) {
                webAppInterface.shutdown()
            }
        }
        ```

**✅ Verificação do Passo 4:**
*   Execute o aplicativo.
*   No Logcat, filtre por "TTS" e "WebAppInterface". Você deve ver as mensagens de inicialização do motor TTS.
*   Para testar a ponte, use o `chrome://inspect` para abrir o console do WebView e execute manualmente: `window.AndroidTTS.speak('Teste de som nativo')`. Você deve ouvir a frase sendo falada pelo sistema Android, e uma mensagem aparecerá no Logcat.

---

## Conclusão e Teste Final

Após completar todos os passos, o aplicativo Android estará totalmente integrado.

**Teste de Aceitação Final:**
1.  Inicie o aplicativo.
2.  Ele deve carregar a página `/display` sem mostrar a tela de login.
3.  Use a aplicação web de gerenciamento (em um computador ou celular) para adicionar um novo paciente à fila.
4.  Quando o paciente for chamado, a Android TV deve anunciar a chamada usando a voz do sistema Android, não uma voz de navegador.

Se todos esses pontos funcionarem, a integração foi um sucesso. Esta arquitetura cria uma experiência de usuário fluida e robusta, combinando o melhor da tecnologia web com o poder dos recursos nativos da plataforma Android.

---