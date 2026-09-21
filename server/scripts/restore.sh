#!/bin/bash
# Restaura um backup criado por backup.sh. PARA os containers antes de
# sobrescrever os dados (senão o Docker pode escrever por cima da
# restauração enquanto ela roda) e sobe de novo no final.
#
# Uso: ./restore.sh /root/backups/seucrm/seucrm-data-20260101-030000.tar.gz

set -euo pipefail

BACKUP_FILE="${1:?Uso: ./restore.sh <caminho_do_backup.tar.gz>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data"
PROJECT_DIR="$SCRIPT_DIR/../.."

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Arquivo de backup não encontrado: $BACKUP_FILE" >&2
  exit 1
fi

echo "Isso vai APAGAR os dados atuais em $DATA_DIR e substituir pelo backup."
read -p "Confirma? (digite 'sim' para continuar) " CONFIRM
if [ "$CONFIRM" != "sim" ]; then
  echo "Cancelado."
  exit 1
fi

cd "$PROJECT_DIR"
docker compose stop backend web

rm -rf "${DATA_DIR:?}"/*
tar -xzf "$BACKUP_FILE" -C "$DATA_DIR"

docker compose up -d
echo "Restauração concluída e containers reiniciados."
