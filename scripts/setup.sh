#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  printf '%s\n' 'Keeping your existing .env. Setup is ready.'
  exit 0
fi
command -v openssl >/dev/null || { printf '%s\n' 'Install OpenSSL first.'; exit 1; }
umask 077
cat > .env <<EOF
DATABASE_USER=qik
DATABASE_PASSWORD=$(openssl rand -hex 24)
DATABASE_NAME=qik
JWT_SECRET=$(openssl rand -base64 32)
DEMO_PASSWORD=$(openssl rand -hex 12)
SPRING_PROFILES_ACTIVE=demo
EOF
printf '%s\n' 'Created private .env with random local passwords and a JWT key.' 'Your demo login password is the DEMO_PASSWORD value in .env.'
