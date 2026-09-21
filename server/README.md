# SeuCRM API

Backend em Node.js/Express para o SeuCRM. Fornece autenticação, dados de
conversas/tickets/atendimento e (em breve) a integração com a API oficial
do WhatsApp — hoje simulada por `WHATSAPP_PROVIDER=mock`.

## Rodando com Docker (recomendado)

Na raiz do projeto (não dentro de `server/`):

```bash
cp server/.env.example server/.env
docker compose up --build
```

Isso sobe Redis e a API na porta `3001`. O banco é SQLite — um arquivo em
`server/data/seucrm.db`, montado como volume para persistir entre restarts
do container. Na primeira vez, rode as migrações e o seed em outro terminal:

```bash
docker compose exec backend npm run prisma:migrate
docker compose exec backend npm run prisma:seed
```

Login de teste após o seed: `admin@seucrm.com` / `mudar123`.

## Rodando sem Docker

Requer Redis acessível localmente (ajuste `REDIS_URL` no `.env` se preciso).
O SQLite não exige nenhum serviço — o arquivo é criado automaticamente em
`server/prisma/dev.db` na primeira migração.

```bash
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

> Por que SQLite e não Postgres: a VPS roda tudo numa máquina só e o volume
> de escrita concorrente (alguns atendentes + webhook do WhatsApp) é baixo
> o suficiente pra isso não ser um problema. Se a equipe crescer muito ou o
> volume de mensagens aumentar bastante, dá pra migrar pro Postgres depois
> — o Prisma facilita essa troca (é basicamente mudar `provider` no
> `schema.prisma`, os `enum` que viraram `String` documentada em
> `src/constants/enums.js` voltariam a ser enums nativos).

## Estrutura

- `src/app.js` — configuração do Express (middlewares, rotas)
- `src/server.js` — ponto de entrada: HTTP + WebSocket
- `src/routes` / `src/controllers` — endpoints da API
- `src/services/whatsapp` — abstração do provedor de WhatsApp (`mock` hoje,
  `cloudApi` quando a conta Meta Business/WABA estiver aprovada — troca-se
  apenas `WHATSAPP_PROVIDER` no `.env`, nenhum outro código muda)
- `src/websocket` — eventos em tempo real (mensagens, tickets)
- `prisma/schema.prisma` — modelo de dados (SQLite)
- `prisma/seed.js` — popula o banco com os mesmos dados de exemplo do
  protótipo frontend (`src/data/*` na raiz do projeto)
- `src/constants/enums.js` — valores válidos dos campos que seriam `enum`
  num banco relacional tradicional (SQLite não suporta enum nativo)

## Próximos passos

- Endpoints de conversas/mensagens/tickets (CRUD real por trás do que hoje
  é mock no frontend)
- Emitir eventos de WebSocket ao criar/atualizar mensagens e tickets
- Webhook real da Meta Cloud API + `CloudApiProvider`
- Upload/armazenamento de mídia (S3/MinIO)
- Filas (BullMQ + Redis) para envio assíncrono e escalonamento de SLA
- Motor de SLA e logs de auditoria
