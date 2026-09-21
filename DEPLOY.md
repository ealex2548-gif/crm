# Deploy na VPS (Hostinger)

Guia passo a passo pra colocar o SeuCRM no ar. Sua VPS (`srv1526505.hstgr.cloud`,
IP `76.13.239.243`) é do tipo "Docker" da Hostinger e já roda outros dois
apps (`pci-fiscal-emissor`, `9router`) atrás de um Traefik — por isso o CRM
usa a porta **8080** em vez da 80, evitando conflito com o que já está no ar.
Sem domínio por enquanto: acesso via `http://76.13.239.243:8080`, sem HTTPS.
Quando você tiver um domínio, ver a seção final.

## 0. Como conectar

Use o **Web console** do painel da Hostinger (botão ao lado de "Reiniciar"
na página da VPS) — abre um terminal root direto no navegador, sem precisar
instalar nada. É o que você já usou pra rodar `docker ps`.

Docker já está instalado nessa VPS — pule a etapa de instalação.

## 1. Levar o código pra VPS

Duas opções — escolha uma:

**Opção A — via Git (recomendado, facilita atualizar depois)**

Se você ainda não tem o projeto num GitHub/GitLab, crie um repositório
privado lá, suba o código de dentro de `PROJETO ERP/crm` (`git remote add
origin ... && git push -u origin master`), e no Web console da VPS:

```bash
git clone SEU_REPOSITORIO_AQUI seucrm
cd seucrm
```

**Opção B — copiar direto do Windows (mais rápido pra testar agora)**

No PowerShell da sua máquina, dentro de `PROJETO ERP`:

```powershell
scp -r crm root@76.13.239.243:/root/seucrm
```

(isso pede a senha root da VPS — a mesma do painel da Hostinger, em
"Senha root" na página da VPS). Depois, no Web console: `cd /root/seucrm`.

## 2. Configurar variáveis de ambiente

```bash
cp server/.env.example server/.env
```

Edite `server/.env` (`nano server/.env`) e ajuste:

- `NODE_ENV=production`
- `JWT_SECRET=` — gere um valor forte, nunca deixe o de exemplo:
  ```bash
  openssl rand -hex 32
  ```
  (cole o resultado no `.env` — o servidor **recusa iniciar** em produção
  se esse valor for fraco ou o de exemplo, de propósito)
- `CORS_ORIGIN=http://76.13.239.243:8080`

Salve com `Ctrl+O`, Enter, `Ctrl+X` (atalhos do nano).

## 3. Subir os containers

```bash
docker compose up -d --build
```

Primeira vez demora alguns minutos (builda o frontend e o backend). Depois:

```bash
docker compose ps
```

Deve mostrar `redis`, `backend` e `web` como `running`.

## 4. Criar o banco e os dados iniciais

```bash
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:seed
```

## 5. Trocar a senha do admin padrão

O seed cria `admin@seucrm.com` com senha `mudar123` — **documentada neste
próprio guia**, então troque antes de usar de verdade:

```bash
docker compose exec backend node -e "
import('./src/config/prisma.js').then(async ({prisma}) => {
  const { hashPassword } = await import('./src/utils/password.js');
  const hash = await hashPassword('SUA_SENHA_NOVA_AQUI');
  await prisma.user.update({ where: { email: 'admin@seucrm.com' }, data: { passwordHash: hash } });
  console.log('Senha atualizada.');
  process.exit(0);
});
"
```

## 6. Testar

Abra `http://76.13.239.243:8080` no navegador. Deve aparecer a tela de login.

Se não abrir, confira se a porta 8080 está liberada no firewall da VPS:

```bash
ufw status
```

Se o `ufw` estiver ativo e a 8080 não estiver na lista:

```bash
ufw allow 8080/tcp
```

## 7. Atualizar depois de mudanças no código

**Via Git:**
```bash
cd seucrm && git pull && docker compose up -d --build
```

**Via scp:** repita o `scp -r` do passo 1 (sobrescreve os arquivos) e rode
`docker compose up -d --build` de novo.

Migrações de banco pendentes (se você adicionar novos campos depois):
```bash
docker compose exec backend npm run prisma:deploy
```

## 8. Backup

Tudo que importa (banco SQLite + arquivos enviados no chat) vive em
`server/data/` no host da VPS — é o volume montado no `docker-compose.yml`.
A Hostinger já faz backup semanal da VPS inteira (vi no painel), mas vale
reforçar com um backup próprio dessa pasta específica também.

## Quando você tiver um domínio

Como essa VPS já tem um Traefik cuidando das portas 80/443 pros outros
apps, integrar o CRM nele (pra ganhar HTTPS automático no mesmo domínio
"bonito") exige configurar o Caddy pra conversar com esse Traefik — não é
só trocar uma linha como seria numa VPS dedicada só a este projeto. Isso é
um passo a mais que vale a pena fazer juntos quando você tiver o domínio em
mãos, pra eu adaptar o `Caddyfile`/`docker-compose.yml` certinho pro seu
caso.
