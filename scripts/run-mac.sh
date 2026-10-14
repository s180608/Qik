#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
./scripts/setup.sh
set -a
. ./.env
set +a
export DATABASE_URL="jdbc:postgresql://127.0.0.1:${QIK_DB_PORT:-5433}/${DATABASE_NAME}"
exec ./qik-backend/mvnw -f qik-backend/pom.xml spring-boot:run
