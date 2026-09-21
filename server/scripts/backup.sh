#!/bin/bash
# Backup do que realmente importa: o banco SQLite + os arquivos enviados
# no chat (server/data/). Roda fora do container, direto no host da VPS
# (não depende do Docker estar saudável pra funcionar).
#
# Uso: ./backup.sh [pasta_de_destino]
# Padrão de destino: /root/backups/seucrm
#
# Mantém as últimas 7 cópias e apaga o resto — ajuste RETENTION se quiser.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data"
BACKUP_DIR="${1:-/root/backups/seucrm}"
RETENTION=7
DATE="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/seucrm-data-$DATE.tar.gz"

if [ ! -d "$DATA_DIR" ]; then
  echo "Pasta de dados não encontrada em $DATA_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
tar -czf "$DEST" -C "$DATA_DIR" .
echo "Backup criado: $DEST ($(du -h "$DEST" | cut -f1))"

# Apaga backups além dos últimos $RETENTION
ls -1t "$BACKUP_DIR"/seucrm-data-*.tar.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm --
echo "Backups mantidos: $(ls -1 "$BACKUP_DIR"/seucrm-data-*.tar.gz 2>/dev/null | wc -l)"
