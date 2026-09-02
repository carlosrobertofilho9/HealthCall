<div align="center">
  <img width="128" height="128" alt="HealthCall Logo" src="https://healthcall-23d13.web.app/healthcall-logo.png" />
  <h1>HealthCall</h1>
  <p><strong>Chamadas de pacientes para UBS, ambulatórios e pequenas unidades de saúde.</strong></p>
  <p>Local-first · sem login obrigatório · sem Supabase obrigatório · funciona na rede local</p>
</div>

---

O **HealthCall** nasceu para resolver um problema simples e frequente: unidades de saúde que precisam chamar pacientes para consultórios, triagem ou enfermagem, mas não possuem um sistema de chamada adequado.

A instalação aberta do HealthCall foi desenhada para funcionar **dentro da própria rede da unidade**, sem exigir conta, autenticação, serviço pago ou conexão permanente com a internet.

## Principais recursos do modo local

- **Sem login obrigatório:** os profissionais não precisam criar contas.
- **Vários postos simultâneos:** médicos, enfermagem, recepção e outros profissionais podem chamar pacientes ao mesmo tempo.
- **Sala preservada:** cada navegador guarda o número/nome da sala e o perfil daquele posto.
- **Painel de TV em tempo real:** novas chamadas aparecem instantaneamente em `/display`.
- **Voz local:** o painel usa o mecanismo de voz do próprio navegador; nenhuma API de TTS é necessária.
- **Som, voz e avisos configuráveis:** podem ser desligados no dispositivo; avisos institucionais também podem ser desligados globalmente.
- **Fila compartilhada:** adicionar, pesquisar, reordenar, chamar, iniciar/finalizar atendimento e remover pacientes.
- **Fichas sequenciais:** geração local de `Ficha 1`, `Ficha 2`, etc.
- **Histórico de chamadas:** registra horário, sala e tipo de profissional que realizou a chamada.
- **Persistência local:** fila e histórico são armazenados em SQLite no computador servidor.
- **Tempo real sem serviço externo:** comunicação servidor → painéis por Server-Sent Events (SSE).

## Arquitetura local

```text
Computador servidor da UBS
├── HealthCall Web
├── API HTTP local
├── SQLite (data/healthcall.sqlite)
└── SSE em tempo real
      │
      ├── Recepção
      ├── Médico · Sala 01
      ├── Médico · Sala 02
      ├── Enfermagem · Sala 04
      └── TV / Painel de chamadas
```

Os dados clínicos/operacionais usados pela fila não precisam sair da rede da unidade.

## Requisitos

- **Node.js 22.13 ou superior**
- npm
- computadores/dispositivos conectados à mesma rede local para uso multiestação

O modo local usa o módulo `node:sqlite` do próprio Node.js, portanto não exige instalar PostgreSQL, Docker ou uma dependência nativa adicional de SQLite.

## Instalação rápida

```bash
git clone https://github.com/carlosrobertofilho9/HealthCall.git
cd HealthCall
npm install
npm run healthcall
```

Depois da compilação, o servidor inicia por padrão em:

```text
http://localhost:3000
```

### Primeiro computador / servidor

1. Abra `http://localhost:3000`.
2. Vá em **Configurar posto**.
3. Informe a sala, o tipo de profissional e, opcionalmente, o nome do profissional.
4. Abra `/display` no monitor ou TV da recepção.
5. Clique uma vez em **Ativar áudio** no painel para permitir som/voz no navegador.

### Outros consultórios

Descubra o IP do computador servidor na rede, por exemplo `192.168.0.15`, e acesse nos demais computadores:

```text
http://192.168.0.15:3000
```

Cada computador configura sua própria sala uma única vez. Essa configuração fica armazenada no navegador daquele posto.

> O HealthCall local deve ser disponibilizado apenas na rede confiável da unidade. Não exponha a porta 3000 diretamente à internet.

## Desenvolvimento

```bash
npm install
npm run dev:local
```

Esse comando inicia:

- Vite em modo de desenvolvimento;
- servidor local HealthCall na porta `8787`;
- proxy automático de `/api` para o backend local.

Scripts úteis:

```bash
npm run dev:local        # frontend + backend local
npm run healthcall       # build + servidor de produção local
npm run healthcall:server
npm run test:local       # testes do backend SQLite/API
npm run build
```

## Supabase é opcional

O código legado com Supabase continua disponível durante a migração, mas **não é necessário para o modo local**.

Para executar explicitamente o modo legado/cloud:

```env
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publicavel
```

Use `.env.example` como referência. Nunca versione `.env`, chaves secretas ou `service_role`.

## Segurança e privacidade

- O banco local é criado em `data/healthcall.sqlite` e essa pasta está ignorada pelo Git.
- O servidor escuta a rede local para permitir múltiplos postos; use uma rede confiável e firewall adequado.
- Não armazene o banco em pasta sincronizada publicamente.
- Se você usar o modo Supabase, configure RLS e privilégios mínimos antes de expor qualquer tabela.
- Chaves `service_role`/secretas nunca devem ser colocadas no frontend.

## Testes e CI

Há testes automatizados para o modo local cobrindo:

- inicialização sem Supabase;
- persistência da fila;
- bloqueio de chamada sem sala configurada;
- registro de sala e perfil profissional;
- geração sequencial de fichas;
- ativação/desativação dos avisos;
- limpeza da fila e histórico.

O workflow `Local-first CI` executa os testes do servidor e o build do modo local em Node 22.13.

## Estrutura relevante

```text
server/
├── app.mjs                         # API + SQLite + SSE
├── healthcall-server.mjs           # inicialização do servidor
└── __tests__/                      # testes do backend local

src/features/local/
├── localApi.ts                     # cliente HTTP/SSE
├── stationSettings.ts              # sala/perfil e preferências persistentes
├── useLocalQueue.ts                # fila em tempo real
└── routes/
    ├── LocalHomePage.tsx
    ├── LocalDisplayPage.tsx
    └── LocalSettingsPage.tsx
```

## Por que local-first?

Para o caso de uso original do HealthCall, a unidade deve conseguir continuar chamando pacientes mesmo com internet instável e sem depender de uma conta em um fornecedor externo. O servidor local mantém a instalação simples e deixa a infraestrutura sob controle da própria unidade.

---

<div align="center">
  <p>HealthCall — tecnologia simples para resolver um problema real da atenção à saúde.</p>
</div>
