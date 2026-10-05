FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
COPY . .
EXPOSE 8799
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8799/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
USER 1001
CMD ["npm", "start"]
