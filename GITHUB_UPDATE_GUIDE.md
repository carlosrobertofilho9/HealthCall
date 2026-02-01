# Guia de Atualização e Deploy do HealthCall

Este guia descreve o processo passo a passo para gerar novas versões do aplicativo HealthCall (.dmg para macOS e .exe para Windows) e publicá-las no GitHub para que o sistema de auto-update funcione.

## Pré-requisitos

1.  **Node.js**: Certifique-se de ter o Node.js instalado (versão 18 ou superior).
2.  **GitHub Token**: Para publicar releases automaticamente, você precisa de um token do GitHub (Personal Access Token).
3.  **Acesso ao Repositório**: Você deve ter permissão de escrita no repositório `carlosrobertofilho9/healthcall`.

## Configuração Inicial (Feito uma única vez)

### 1. Gerar Token do GitHub
1.  Vá para [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens).
2.  Clique em **Generate new token (classic)**.
3.  Dê um nome (ex: "HealthCall Builder").
4.  Selecione o escopo **repo** (full control of private repositories).
5.  Clique em **Generate token** e COPIE o token.

### 2. Configurar Variável de Ambiente
No seu terminal (Mac), exporte o token antes de rodar o build:
```bash
export GH_TOKEN="seu_token_aqui"
```
*Dica: Você pode adicionar essa linha ao seu `~/.zshrc` ou `~/.bash_profile` para não precisar digitar sempre.*

---

## Passo a Passo para Lançar uma Atualização

Sempre que você fizer alterações no código e quiser liberar uma nova versão para os usuários:

### 1. Testar o App
Garanta que tudo está funcionando em modo de desenvolvimento:
```bash
npm run electron:dev
```

### 2. Atualizar a Versão
O auto-update só funciona se a versão for superior à anterior. Atualize o arquivo `package.json`:

Para uma correção pequena (ex: 2.0.0 -> 2.0.1):
```bash
npm version patch
```

Para uma nova funcionalidade (ex: 2.0.0 -> 2.1.0):
```bash
npm version minor
```

### 3. Gerar os Executáveis e Publicar
Este comando irá compilar o React, construir o Electron e enviar os arquivos para o GitHub Releases (como Draft/Rascunho):

```bash
# Lembre-se de ter o GH_TOKEN exportado
npm run electron:build
```

**Nota:** Se você estiver no Mac, ele gerará o `.dmg`. O `.exe` do Windows também pode ser gerado se configurado, mas sem assinatura digital ele pode apresentar alertas de segurança no Windows.

### 4. Publicar a Release no GitHub
1.  Acesse a aba **Releases** no seu repositório GitHub: `https://github.com/carlosrobertofilho9/healthcall/releases`.
2.  Você verá uma nova release criada como **Draft** (Rascunho).
3.  Clique em **Edit** (lápis).
4.  Adicione as notas da versão (o que mudou).
5.  Clique em **Publish release**.

Assim que você publicar, os aplicativos instalados nos computadores dos clientes detectarão a atualização automaticamente (conforme configurado no `main.js`).

---

## Solução de Problemas Comuns

### Erro: `Cannot find package 'auto-launch'` ou `SyntaxError`
Isso geralmente ocorre por problemas de compatibilidade entre módulos.
**Solução:** Certifique-se de rodar `npm install` antes de construir. Se persistir, verifique se o arquivo `electron/main.js` está usando `createRequire` para importar módulos antigos.

### Erro de Permissão no Mac (Damaged / Can't be opened)
Como o aplicativo não é assinado com um certificado pago da Apple ($99/ano), o macOS pode bloquear a execução.
**Solução para o Cliente:**
1.  Clicar com o botão direito no App > Abrir.
2.  Ou ir em **Configurações do Sistema > Privacidade e Segurança** e permitir a abertura do HealthCall.

### Erro de Native Module (`better-sqlite3`)
Se aparecer erro dizendo que o módulo foi compilado para uma versão diferente do Node/Electron.
**Solução:** Rode o comando de correção manual:
```bash
npm run postinstall
```
Isso reconstrói as dependências para a versão exata do Electron.

---

## Resumo dos Comandos

```bash
# 1. Instalar dependências (se necessário)
npm install

# 2. Subir versão
npm version patch

# 3. Buildar e Enviar (precisa do GH_TOKEN)
export GH_TOKEN="ghp_xxxxxxxxxxxx"
npm run electron:build

# 4. Vá ao GitHub e publique a Release!
```
