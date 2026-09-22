FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

FROM base AS dependencies
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter reservation-waitlist-backend...

FROM dependencies AS builder
COPY apps/api ./apps/api
RUN pnpm --filter reservation-waitlist-backend build

FROM base AS production-dependencies
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod --filter reservation-waitlist-backend...

FROM node:24-alpine AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV PORT=18080
COPY --chown=node:node --from=production-dependencies /app/node_modules /app/node_modules
COPY --chown=node:node --from=production-dependencies /app/apps/api/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/apps/api/package.json ./package.json
COPY --chown=node:node --from=builder /app/apps/api/dist ./dist
COPY --chown=node:node --from=builder /app/apps/api/drizzle ./drizzle
USER node
EXPOSE 18080
CMD ["node", "dist/main.js"]
