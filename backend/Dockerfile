FROM node:22-alpine

WORKDIR /app

# Install ALL dependencies (tsx + prisma are runtime deps)
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci && npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 8787

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
