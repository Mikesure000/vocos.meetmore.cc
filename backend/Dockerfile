FROM node:22-alpine

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm ci

# Copy source - NO build step, use tsx to run TypeScript directly
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY entrypoint.sh /app/entrypoint.sh

# Generate Prisma client
RUN npx prisma generate

# Create data directory
RUN mkdir -p /app/data
RUN chmod +x /app/entrypoint.sh

EXPOSE 8787

VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/vocosai.sqlite
ENV HOST=0.0.0.0
ENV PORT=8787

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
