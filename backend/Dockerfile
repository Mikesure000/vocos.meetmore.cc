FROM node:22-alpine

WORKDIR /app

# Install ONLY production dependencies (tsx, prisma moved to deps)
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY entrypoint.sh /app/entrypoint.sh

# Generate Prisma client for MySQL
RUN npx prisma generate

# Create data directory (fallback for SQLite)
RUN mkdir -p /app/data
RUN chmod +x /app/entrypoint.sh

EXPOSE 8787

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
