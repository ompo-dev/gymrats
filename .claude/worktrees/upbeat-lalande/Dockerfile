FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb* package-lock.json* pnpm-lock.yaml* ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN bun install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /app ./

EXPOSE 3000
CMD ["bun", "--bun", "server/custom-server.ts"]
