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

Isso sobe Postgres, Redis e a API na porta `3001`. Na primeira vez, rode as
migrações e o seed em outro terminal:

```bash
docker compose exec backend npm run prisma:migrate
docker compose exec backend npm run prisma:seed
```

Login de teste após o seed: `admin@seucrm.com` / `mudar123`.

## Rodando sem Docker

Requer Postgres e Redis acessíveis localmente (ajuste `DATABASE_URL` e
`REDIS_URL` no `.env`).

> **Atenção:** esta máquina já tem um PostgreSQL 9.5 (serviço do Windows)
> ocupando a porta 5432, usado por outro projeto. Não reaproveite esse
> serviço para o SeuCRM — ele é antigo (fora de suporte) e pertence a
> outra aplicação. Rodando via Docker (recomendado acima) isso não é um
> problema, pois o Postgres do `docker-compose.yml` também expõe a porta
> 5432 do host — se for rodar os dois ao mesmo tempo, mude a porta do
> serviço em `docker-compose.yml` (ex: `"5433:5432"`) ou pare o serviço
> Windows antes.

```bash
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Estrutura

- `src/app.js` — configuração do Express (middlewares, rotas)
- `src/server.js` — ponto de entrada: HTTP + WebSocket
- `src/routes` / `src/controllers` — endpoints da API
- `src/services/whatsapp` — abstração do provedor de WhatsApp (`mock` hoje,
  `cloudApi` quando a conta Meta Business/WABA estiver aprovada — troca-se
  apenas `WHATSAPP_PROVIDER` no `.env`, nenhum outro código muda)
- `src/websocket` — eventos em tempo real (mensagens, tickets)
- `prisma/schema.prisma` — modelo de dados
- `prisma/seed.js` — popula o banco com os mesmos dados de exemplo do
  protótipo frontend (`src/data/*` na raiz do projeto)

## Próximos passos

- Endpoints de conversas/mensagens/tickets (CRUD real por trás do que hoje
  é mock no frontend)
- Emitir eventos de WebSocket ao criar/atualizar mensagens e tickets
- Webhook real da Meta Cloud API + `CloudApiProvider`
- Upload/armazenamento de mídia (S3/MinIO)
- Filas (BullMQ + Redis) para envio assíncrono e escalonamento de SLA
- Motor de SLA e logs de auditoria
