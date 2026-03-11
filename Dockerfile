# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.6 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS source
COPY . .
RUN bun install --frozen-lockfile
RUN bun x prisma generate --schema packages/db/prisma/schema.prisma

FROM source AS web-builder
ARG DATABASE_URL=postgresql://gymrats:gymrats@db:5432/gymrats?schema=public
ARG REDIS_URL=redis://redis:6379
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=
ARG NEXT_PUBLIC_FAKE_WITHDRAW=false
ARG API_INTERNAL_URL=http://api:4000
ARG BETTER_AUTH_URL=http://api:4000
ARG CORS_ALLOWED_ORIGINS=http://localhost:3000
ARG TRUSTED_ORIGINS=http://localhost:3000
ARG BETTER_AUTH_SECRET=change-me
ARG GOOGLE_CLIENT_ID=change-me
ARG GOOGLE_CLIENT_SECRET=change-me
ARG ABACATEPAY_API_TOKEN=
ARG ABACATEPAY_WEBHOOK_SECRET=
ARG CRON_SECRET=change-me
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV REDIS_URL=${REDIS_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_FAKE_WITHDRAW=${NEXT_PUBLIC_FAKE_WITHDRAW}
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
ENV TRUSTED_ORIGINS=${TRUSTED_ORIGINS}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV ABACATEPAY_API_TOKEN=${ABACATEPAY_API_TOKEN}
ENV ABACATEPAY_WEBHOOK_SECRET=${ABACATEPAY_WEBHOOK_SECRET}
ENV CRON_SECRET=${CRON_SECRET}
RUN bun run --cwd apps/web build

FROM source AS api-builder
ENV NODE_ENV=production
ENV GYMRATS_RUNTIME_ROLE=api
RUN bun run --cwd apps/api build

FROM source AS worker-builder
ENV NODE_ENV=production
ENV GYMRATS_RUNTIME_ROLE=worker
RUN bun run --cwd apps/worker build

FROM source AS cron-builder
ENV NODE_ENV=production
ENV GYMRATS_RUNTIME_ROLE=cron
RUN bun run --cwd apps/cron build

FROM source AS tools-runner
WORKDIR /app
ENV NODE_ENV=production

FROM base AS web-runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=web-builder /app /app
EXPOSE 3000
CMD ["sh", "-lc", "cd apps/web && bun run start:frontend"]

FROM base AS api-runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV GYMRATS_RUNTIME_ROLE=api
COPY --from=api-builder /app /app
EXPOSE 4000
CMD ["bun", "apps/api/dist/index.js"]

FROM base AS worker-runner
WORKDIR /app
ENV NODE_ENV=production
ENV GYMRATS_RUNTIME_ROLE=worker
COPY --from=worker-builder /app /app
CMD ["bun", "apps/worker/dist/index.js"]

FROM base AS cron-runner
WORKDIR /app
ENV NODE_ENV=production
ENV GYMRATS_RUNTIME_ROLE=cron
COPY --from=cron-builder /app /app
CMD ["bun", "apps/cron/dist/index.js"]
