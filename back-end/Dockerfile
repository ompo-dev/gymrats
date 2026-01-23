FROM oven/bun:1.3.6 AS deps
WORKDIR /app
COPY back-end/package.json /app/package.json
COPY back-end/packages/contracts /app/packages/contracts
COPY back-end/prisma/schema.prisma /app/prisma/schema.prisma
RUN bun install

FROM deps AS builder
COPY back-end /app
RUN bun run build

FROM oven/bun:1.3.6 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun --bun -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "--bun", "dist/main.js"]
