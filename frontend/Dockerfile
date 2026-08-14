FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy all source
COPY . .

# Increase Node memory limit to prevent OOM kill (code 137)
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Production image ──
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
