#!/bin/sh
set -eu

############################################
# Container entrypoint
############################################
# 1) Wait until PostgreSQL accepts connections
# 2) Optionally run TypeORM migrations
# 3) Optionally seed base data (roles, ...)
# 4) Start the NestJS API
############################################

echo "----------------------------------------"
echo " Coffee Marketplace API - starting"
echo " NODE_ENV=${NODE_ENV:-production}"
echo "----------------------------------------"

DB_HOST="${DATABASE_HOST:-postgres}"
DB_PORT="${DATABASE_PORT:-5432}"

echo "-> Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT} ..."

# Alpine-friendly TCP probe (no extra packages required)
i=0
until node -e "
  const net = require('net');
  const socket = net.connect({
    host: process.env.DATABASE_HOST || 'postgres',
    port: Number(process.env.DATABASE_PORT || 5432),
  }, () => {
    socket.end();
    process.exit(0);
  });
  socket.on('error', () => process.exit(1));
" 2>/dev/null
do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "x PostgreSQL did not become ready in time."
    exit 1
  fi
  sleep 2
done

echo "OK PostgreSQL is ready"

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "-> Running database migrations ..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/database/config/datasource.js
  echo "OK Migrations complete"
else
  echo "-> Skipping migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})"
fi

if [ "${RUN_SEEDS:-false}" = "true" ]; then
  echo "-> Running database seeds ..."
  node dist/database/seeds/database.seeder.js
  echo "OK Seeds complete"
else
  echo "-> Skipping seeds (RUN_SEEDS=${RUN_SEEDS:-false})"
fi

echo "-> Starting NestJS on 0.0.0.0:${PORT:-3000}"
exec node dist/main.js
