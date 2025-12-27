FROM node:24-alpine AS base

RUN apk add --no-cache openssl curl

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

RUN pnpm approve-builds

COPY . .

RUN pnpm prisma generate

FROM base AS dev

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]

FROM base AS prod

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
