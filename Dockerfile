# Multi-stage build for Node.js services
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files (from docker context)
COPY package.json ./
COPY package-lock.json* ./
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then \
    npm ci --omit=dev && npm cache clean --force; \
    else \
    npm install --omit=dev && npm cache clean --force; \
    fi

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json* ./
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then \
    npm ci; \
    else \
    npm install; \
    fi

# Copy source code
COPY . .

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

USER nodejs

# Port will be set via environment variable
EXPOSE 3000

CMD ["node", "src/app.js"]
