# Multi-stage build for all microservices in one container
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy all package.json files
COPY api-gateway/package*.json ./api-gateway/
COPY identity-service/package*.json ./identity-service/
COPY product-service/package*.json ./product-service/
COPY order-service/package*.json ./order-service/
COPY smart-builder-service/package*.json ./smart-builder-service/
COPY chatbot-service/package*.json ./chatbot-service/
COPY search-service/package*.json ./search-service/
COPY system-service/package*.json ./system-service/
COPY voucher-service/package*.json ./voucher-service/

# Install dependencies for each service
RUN cd api-gateway && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd identity-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd product-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd order-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd smart-builder-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd chatbot-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd search-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd system-service && npm ci --omit=dev && npm cache clean --force && cd .. && \
    cd voucher-service && npm ci --omit=dev && npm cache clean --force && cd ..

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/api-gateway/node_modules ./api-gateway/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/identity-service/node_modules ./identity-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/product-service/node_modules ./product-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/order-service/node_modules ./order-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/smart-builder-service/node_modules ./smart-builder-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/chatbot-service/node_modules ./chatbot-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/search-service/node_modules ./search-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/system-service/node_modules ./system-service/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/voucher-service/node_modules ./voucher-service/node_modules

# Copy application code
COPY --chown=nodejs:nodejs api-gateway ./api-gateway
COPY --chown=nodejs:nodejs identity-service ./identity-service
COPY --chown=nodejs:nodejs product-service ./product-service
COPY --chown=nodejs:nodejs order-service ./order-service
COPY --chown=nodejs:nodejs smart-builder-service ./smart-builder-service
COPY --chown=nodejs:nodejs chatbot-service ./chatbot-service
COPY --chown=nodejs:nodejs search-service ./search-service
COPY --chown=nodejs:nodejs system-service ./system-service
COPY --chown=nodejs:nodejs voucher-service ./voucher-service

# Copy start script
COPY --chown=nodejs:nodejs start-all-services.sh ./start-all-services.sh
RUN chmod +x ./start-all-services.sh

# Ensure /tmp is writable
RUN chmod 1777 /tmp

USER nodejs

# Port for API Gateway (exposed to Render)
EXPOSE 3000

# Start all services
CMD ["./start-all-services.sh"]
