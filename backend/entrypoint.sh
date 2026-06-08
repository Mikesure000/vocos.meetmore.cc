#!/bin/sh
echo "[Entrypoint] Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || echo "[Entrypoint] db push skipped"
echo "[Entrypoint] Starting VocosAI server (tsx)..."
exec npx tsx src/index.ts
