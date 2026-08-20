# 1. Base image
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

# 2. Dependencies stage (All dependencies for building)
FROM base AS dependencies
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build
RUN pnpm prune --prod

# 4. Production Runner stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: run as non-root user
USER node

# Copy built application and production dependencies
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/drizzle ./drizzle

EXPOSE 3000

CMD ["node", "dist/main.js"]
