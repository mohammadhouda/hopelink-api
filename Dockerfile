# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: final image ──────────────────────────────────────────────────────
FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY prisma ./prisma
COPY src    ./src
COPY package.json ./

# Generate Prisma client (runs inside the image, targets linux-musl)
RUN npx prisma generate

EXPOSE 5000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
