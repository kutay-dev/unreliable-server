FROM node:24-alpine

RUN apk add --no-cache openssl curl

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Copy only manifests first (for cache)
COPY package.json pnpm-lock.yaml ./

# Install deps
RUN pnpm install --frozen-lockfile

# Approve native builds (prisma, argon2, etc)
RUN pnpm approve-builds

# Copy source
COPY . .

# Prisma client
RUN pnpm prisma generate

# Build
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
