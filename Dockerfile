# ==========================================
# STAGE 1: BASE (OS & Dependencies)
# ==========================================
FROM node:24-alpine AS base
# Install OpenSSL (Required for Prisma Engine) and libc6 compatibility
RUN apk add --no-cache openssl libc6-compat
WORKDIR /usr/src/app

# ==========================================
# STAGE 2: DEPENDENCIES (Cache Layer)
# ==========================================
FROM base AS deps
COPY package*.json ./
# Install ALL dependencies (including devDependencies for compilation)
RUN npm ci

# ==========================================
# STAGE 3: DEVELOPMENT TARGET
# ==========================================
FROM deps AS development
ENV NODE_ENV=development
# Copy source code for development (will be overridden by volume in compose, 
# but useful for standalone builds)
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY nodemon.json ./
COPY firebase-service-account.json ./

# Generate Prisma Client (Output: src/shared/prisma-client)
RUN npx prisma generate

# Expose ports for API and Prisma Studio
EXPOSE 3000 5555
CMD ["npm", "run", "dev"]

# ==========================================
# STAGE 4: BUILDER (Compilation)
# ==========================================
FROM deps AS builder
# Copy necessary files for build
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# 1. Generate Prisma Client (Creates files in src/shared/prisma-client)
RUN npx prisma generate

# 2. Compile TypeScript (Compiles src/ -> dist/)
# This includes the generated prisma client code
RUN npm run build

# 3. Prune dependencies (Remove devDependencies for smaller image)
RUN npm prune --production

# ==========================================
# STAGE 5: PRODUCTION TARGET
# ==========================================
FROM base AS production
ENV NODE_ENV=production

# Security: Run as non-root user 'node'
RUN chown -R node:node /usr/src/app
USER node

# Copy package.json
COPY --chown=node:node --from=builder /usr/src/app/package*.json ./

# Copy production node_modules
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules

# Copy compiled code (including the compiled prisma client)
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Copy original schema (Optional, but often useful for debug/migrations)
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start the compiled app
CMD ["npm", "start"]