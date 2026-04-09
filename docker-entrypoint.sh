#!/bin/sh
set -e

# Monta DATABASE_URL para o Prisma quando só DB_* estiver definido (deploy com PostgreSQL no host).
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
fi

exec "$@"
