# HealthCall Local Backend v2

O HealthCall utiliza um único servidor local Node.js com SQLite e SSE.

## Persistência

- fila e chamadas
- agenda e remarcações
- perfil/configurações da unidade
- avisos
- pendências
- chat da recepção
- receitas e PDFs
- pacientes, feridas, evoluções, fotos e eventos de status

Arquivos são mantidos em `data/media/` e o banco em `data/healthcall.sqlite`.

## Tempo real

Um único endpoint SSE (`/api/events`) distribui eventos por domínio para todos os postos conectados à rede local.

## Privacidade

O backend não exige conta em nuvem. Telemetria de áudio permanece apenas em memória no dispositivo. O TTS utiliza a Web Speech API local do navegador.
