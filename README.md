<div align="center">
  <img width="128" height="128" alt="HealthCall Logo" src="./public/healthcall-logo.png" />
  <h1>HealthCall</h1>
  <p><strong>Sistema local de chamada e apoio ao atendimento para UBS, ambulatórios e pequenas unidades de saúde.</strong></p>
  <p>Local-first · sem login obrigatório · SQLite · rede local · código aberto</p>
</div>

---

O **HealthCall** nasceu para resolver um problema simples e frequente: unidades de saúde que precisam organizar a fila e chamar pacientes para consultórios, triagem ou enfermagem, mas não possuem um sistema de chamada adequado.

A versão 4 foi reconstruída para funcionar **dentro da própria unidade de saúde**, com um computador atuando como servidor e os demais computadores, tablets, celulares e televisores acessando o sistema pela mesma rede local.

A operação diária não depende de internet, conta externa ou serviço pago.

> **Versão atual:** `v4.0.0-beta.1` — Local First Beta.
>
> Esta é uma versão beta. Antes de utilizar em rotina assistencial, valide a instalação e os fluxos da sua unidade em ambiente de teste.

## O que o HealthCall faz

### Fila e chamadas

- vários profissionais podem utilizar o sistema ao mesmo tempo;
- médicos, enfermagem, recepção e outros postos podem chamar pacientes simultaneamente;
- cada computador preserva sua própria **sala**, **função** e, opcionalmente, o **nome do profissional**;
- fila compartilhada em tempo real;
- inclusão e pesquisa de pacientes;
- reordenação da fila;
- início e finalização de atendimento;
- fichas sequenciais, como `Ficha 1`, `Ficha 2`, etc.;
- histórico de chamadas com horário, sala e estação responsável.

### Painel de chamadas

- painel dedicado em `/display` para TV, monitor ou computador da recepção;
- atualização instantânea das chamadas pela rede local;
- voz utilizando o mecanismo de fala do próprio navegador;
- aviso sonoro opcional;
- opção para desligar voz, som e avisos institucionais;
- modo de tela cheia.

### Outros módulos

A versão 4 também mantém os demais fluxos do HealthCall utilizando armazenamento local:

- agenda e marcações;
- bloqueios e remarcações;
- recepção e mensagens internas;
- pendências operacionais;
- avisos institucionais;
- receitas e PDFs;
- acompanhamento de feridas, evoluções e fotografias;
- perfil e configurações da unidade.

## Como funciona

```text
                 REDE LOCAL DA UBS

          ┌────────────────────────────┐
          │ Computador servidor        │
          │                            │
          │ HealthCall Web             │
          │ API HTTP local             │
          │ SQLite                     │
          │ Arquivos locais            │
          │ SSE em tempo real          │
          └──────────────┬─────────────┘
                         │
          ───────────────┼────────────────
                         │
        ┌────────────────┼──────────────────┐
        │                │                  │
   Recepção         Consultório 1      Enfermagem
                       Sala 01            Sala 04
        │
        └────────────────────────── TV / Display
```

O banco principal fica no computador servidor em:

```text
data/healthcall.sqlite
```

Arquivos enviados pelo sistema, como imagens e PDFs, ficam em:

```text
data/media/
```

## Requisitos

- **Node.js 22.13 ou superior**;
- npm;
- um computador para funcionar como servidor;
- os demais dispositivos conectados à mesma rede local quando houver uso multiestação.

O HealthCall utiliza o módulo `node:sqlite` do próprio Node.js. Não é necessário instalar PostgreSQL, Docker ou um servidor de banco de dados separado.

## Instalação recomendada — versão beta

A forma mais simples de testar é baixar a versão beta mais recente na página de Releases:

**[HealthCall v4.0.0-beta.1 — Local First Beta](https://github.com/carlosrobertofilho9/HealthCall/releases/tag/v4.0.0-beta.1)**

Arquivos disponíveis:

- `HealthCall-4.0.0-beta.1.zip` — recomendado para Windows;
- `HealthCall-4.0.0-beta.1.tar.gz` — macOS/Linux;
- `SHA256SUMS.txt` — hashes para conferência da integridade dos arquivos.

É necessário ter o Node.js 22.13+ instalado no computador servidor.

## Instalação pelo código-fonte

```bash
git clone https://github.com/carlosrobertofilho9/HealthCall.git
cd HealthCall
npm install
npm run healthcall
```

O servidor inicia por padrão na porta `3000`.

No próprio computador servidor, abra:

```text
http://localhost:3000
```

## Primeiro uso

No computador que ficará como servidor:

1. inicie o HealthCall;
2. abra `http://localhost:3000`;
3. configure o posto com sala, função e, se desejar, nome do profissional;
4. abra o painel `/display` no monitor ou TV que exibirá as chamadas;
5. no painel, clique uma vez em **Ativar áudio** para permitir som e voz no navegador.

## Como descobrir o IP do HealthCall

Não é mais necessário procurar o IP manualmente nas configurações do Windows, macOS ou Linux.

No próprio HealthCall:

1. abra **Configurações**;
2. selecione a aba **Rede**;
3. consulte a seção **IPs para acessar pela rede local**;
4. copie um dos endereços exibidos.

O HealthCall mostra automaticamente:

- o **hostname** do computador servidor;
- o endereço utilizado pelo dispositivo atual;
- os endereços IPv4 encontrados no computador servidor;
- a interface de rede correspondente;
- o endereço completo pronto para ser aberto em outro dispositivo.

Exemplo:

```text
IP do servidor: 192.168.0.15

Endereço para os outros computadores:
http://192.168.0.15:3000
```

A própria tela possui o botão **Copiar endereço**.

O servidor também mostra os endereços disponíveis no terminal ao iniciar.

### Acessando de outro computador, tablet ou celular

1. confirme que o dispositivo está conectado à **mesma rede local** do computador servidor;
2. no servidor, abra **Configurações > Rede**;
3. copie o endereço indicado;
4. cole esse endereço no navegador do outro dispositivo.

Por exemplo:

```text
http://192.168.0.15:3000
```

Depois disso, configure a sala daquele posto. A configuração da estação fica preservada no navegador daquele dispositivo.

> Se outro dispositivo não conseguir abrir o endereço, verifique primeiro o firewall do computador servidor e se ambos realmente estão na mesma rede Wi-Fi ou cabeada.

## Configuração de cada estação

Cada computador pode representar um posto diferente.

Exemplo:

```text
Computador A
Médico
Sala 01

Computador B
Médico
Sala 02

Computador C
Enfermagem
Sala 04

Computador D
Recepção
```

A sala e a função ficam armazenadas localmente no navegador de cada posto, portanto não precisam ser preenchidas novamente a cada chamada.

## Painel da TV

Abra no navegador da TV ou do computador conectado ao monitor:

```text
http://IP-DO-SERVIDOR:3000/display
```

Exemplo:

```text
http://192.168.0.15:3000/display
```

Na primeira abertura, clique em **Ativar áudio**. Os navegadores normalmente exigem uma interação do usuário antes de permitir reprodução automática de sons ou voz.

## Configurações de avisos e áudio

O HealthCall permite controlar:

- som das chamadas;
- voz das chamadas;
- avisos institucionais naquele dispositivo;
- avisos institucionais globalmente para a unidade.

Essas opções podem ser alteradas nas configurações sem interromper a fila.

## Desenvolvimento

```bash
npm install
npm run dev:local
```

Esse comando inicia:

- Vite para o frontend;
- servidor HealthCall local na porta `8787`;
- proxy de `/api` para o backend local.

Scripts principais:

```bash
npm run dev:local          # frontend + backend para desenvolvimento
npm run healthcall         # compila e inicia o HealthCall local
npm run healthcall:server  # inicia apenas o servidor
npm run test:local         # testes do backend/API/SQLite
npm run build              # build do frontend
```

## Estrutura principal

```text
HealthCall/
├── server/
│   ├── app.mjs                 # servidor HTTP, fila, SQLite e SSE
│   ├── extended.mjs            # módulos adicionais da API local
│   ├── network.mjs             # descoberta de hostname e IPs locais
│   ├── healthcall-server.mjs   # inicialização do servidor
│   └── __tests__/              # testes do backend
│
├── src/
│   ├── features/
│   │   ├── dashboard/          # fila e atendimento
│   │   ├── display/            # componentes do painel
│   │   ├── appointments/       # agenda
│   │   ├── reception/          # recepção e mensagens
│   │   ├── warnings/           # avisos
│   │   ├── prescriptions/      # receitas
│   │   ├── wounds/             # acompanhamento de feridas
│   │   └── settings/           # perfil, aparência e rede
│   └── lib/
│       └── apiClient.ts        # cliente da API local
│
└── data/
    ├── healthcall.sqlite       # banco local — criado em execução
    └── media/                  # arquivos locais — criado em execução
```

## Persistência e backup

Os dados importantes ficam concentrados dentro da pasta `data/` do computador servidor.

Para uma cópia de segurança da instalação, preserve principalmente:

```text
data/healthcall.sqlite
data/media/
```

Recomenda-se realizar backups periódicos em local seguro, especialmente antes de atualizar uma instalação utilizada em ambiente real.

Evite colocar o banco ativo diretamente em uma pasta sincronizada em tempo real por serviços de armazenamento, pois isso pode causar conflitos ou corrupção do arquivo SQLite.

## Segurança e privacidade

O HealthCall foi desenhado para operar em uma **rede local confiável**.

Recomendações:

- não exponha a porta `3000` diretamente à internet;
- mantenha o computador servidor protegido por senha e com sistema operacional atualizado;
- utilize firewall;
- permita acesso apenas à rede da unidade;
- faça backups periódicos;
- defina rotinas de retenção e exclusão de dados compatíveis com a realidade da instituição;
- evite manter dados pessoais por mais tempo que o necessário;
- antes do uso assistencial rotineiro, valide os fluxos locais de privacidade, segurança e LGPD.

Como não há login obrigatório, qualquer dispositivo que consiga acessar o HealthCall na rede local deve ser considerado um dispositivo autorizado da unidade. Segmentar corretamente a rede é importante.

## Testes e integração contínua

O backend possui testes automatizados para os principais fluxos locais, incluindo:

- inicialização do servidor;
- descoberta das informações de rede e IP;
- fila de pacientes;
- chamadas a partir de salas configuradas;
- fichas sequenciais;
- perfil e configurações;
- agenda e remarcações;
- avisos;
- pendências;
- recepção;
- receitas;
- acompanhamento de feridas;
- limpeza de fila e histórico.

O GitHub Actions executa os testes em Node.js 22.13 e também valida o build do frontend.

## Releases

Versões beta e futuras versões estáveis são publicadas em:

**[GitHub Releases](https://github.com/carlosrobertofilho9/HealthCall/releases)**

O pipeline de release:

1. instala as dependências;
2. executa os testes do backend;
3. compila o frontend;
4. cria os pacotes portáteis;
5. gera hashes SHA-256;
6. publica os arquivos no GitHub Releases.

## Por que local-first?

O HealthCall nasceu para unidades que muitas vezes precisam continuar funcionando mesmo quando a internet está instável ou indisponível.

Em uma instalação local:

- a chamada de pacientes continua funcionando sem internet;
- os dispositivos se comunicam diretamente pela rede da unidade;
- o banco e os arquivos permanecem sob controle da própria instituição;
- não existe mensalidade de infraestrutura obrigatória para utilizar o sistema;
- a implantação pode ser feita em hardware simples já disponível na unidade.

## Status do projeto

A versão `4.0.0-beta.1` representa uma mudança importante de arquitetura e ainda deve ser considerada **beta**.

Contribuições, testes em diferentes ambientes e relatos de problemas são bem-vindos.

---

<div align="center">
  <p><strong>HealthCall</strong></p>
  <p>Tecnologia simples para resolver um problema real da atenção à saúde.</p>
</div>
