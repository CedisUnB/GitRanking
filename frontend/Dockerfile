FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

# Prisma generate runs during npm ci via postinstall; provide a placeholder URL
# so the image build does not depend on production secrets.
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm ci --include=dev

ARG CACHE_BUST
RUN echo "cache-bust: $CACHE_BUST" > /dev/null

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-lc", "npm run start -- --hostname ${HOSTNAME:-0.0.0.0} --port ${PORT:-3000}"]