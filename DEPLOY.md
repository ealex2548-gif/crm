# Deploy na VPS (Hostinger)

Guia passo a passo pra colocar o SeuCRM no ar. Assume uma VPS Ubuntu/Debian
com acesso root via SSH — o padrão da Hostinger. Sem domínio por enquanto:
o CRM fica acessível pelo IP da VPS, via HTTP simples (sem certificado).
Quando você tiver um domínio, é uma mudança de uma linha (ver o final deste
guia).

## 0. O que você precisa antes de começar

- O IP da VPS e a senha/chave root que a Hostinger te deu
- Um cliente SSH (o `ssh` já vem no Windows 10/11; ou use o PuTTY)

## 1. Conectar na VPS

```bash
ssh root@SEU_IP_AQUI
```

## 2. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Isso instala o Docker Engine e o `docker compose` (plugin v2) juntos.
Confirme:

```bash
docker compose version
```

## 3. Levar o código pra VPS

Duas opções — escolha uma:

**Opção A — via Git (recomendado, facilita atualizar depois)**

Se você ainda não tem o projeto num GitHub/GitLab, crie um repositório
privado lá, suba o código de dentro de `PROJETO ERP/crm` (`git remote add
origin ... && git push -u origin master`), e na VPS:

```bash
git clone SEU_REPOSITORIO_AQUI seucrm
cd seucrm
```

**Opção B — copiar direto do Windows (mais rápido pra testar agora)**

No PowerShell, dentro de `PROJETO ERP`:

```powershell
scp -r crm root@SEU_IP_AQUI:/root/seucrm
```

Depois, na VPS: `cd /root/seucrm`.

## 4. Configurar variáveis de ambiente

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
- `CORS_ORIGIN=http://SEU_IP_AQUI` (ou o domínio, quando tiver um)

## 5. Subir os containers

```bash
docker compose up -d --build
```

Primeira vez demora alguns minutos (builda o frontend e o backend). Depois:

```bash
docker compose ps
```

Deve mostrar `redis`, `backend` e `web` como `running`.

## 6. Criar o banco e os dados iniciais

```bash
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:seed
```

## 7. Trocar a senha do admin padrão

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

## 8. Testar

Abra `http://SEU_IP_AQUI` no navegador. Deve aparecer a tela de login.

Se não abrir, confira o firewall:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw enable
```

## 9. Atualizar depois de mudanças no código

**Via Git:**
```bash
cd seucrm && git pull && docker compose up -d --build
```

**Via scp:** repita o `scp -r` do passo 3 (sobrescreve os arquivos) e rode
`docker compose up -d --build` de novo.

Migrações de banco pendentes (se você adicionar novos campos depois):
```bash
docker compose exec backend npm run prisma:deploy
```

## 10. Backup

Tudo que importa (banco SQLite + arquivos enviados no chat) vive em
`server/data/` no host da VPS — é o volume montado no `docker-compose.yml`.
Faça backup dessa pasta regularmente (ex: um cron rodando `rsync` ou `tar`
pra outro lugar). Se essa pasta se perder, perde-se tudo.

## Quando você tiver um domínio

1. Aponte o DNS do domínio (registro A) pro IP da VPS.
2. Em `Caddyfile`, troque a linha `:80` pelo domínio, ex:
   ```
   crm.suaempresa.com.br {
   ```
3. Atualize `CORS_ORIGIN` no `server/.env` pra `https://crm.suaempresa.com.br`.
4. `docker compose up -d --build`.

O Caddy detecta que agora é um domínio de verdade e provisiona HTTPS
automaticamente (Let's Encrypt), renovando sozinho. Nenhuma outra mudança
é necessária.
