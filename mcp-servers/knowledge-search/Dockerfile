FROM node:22-slim AS builder
WORKDIR /app
COPY mcp-servers/knowledge-search/package.json mcp-servers/knowledge-search/package-lock.json* ./
RUN npm ci
COPY mcp-servers/knowledge-search/tsconfig.json ./
COPY mcp-servers/knowledge-search/src/ src/
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY mcp-servers/knowledge-search/package.json mcp-servers/knowledge-search/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/ dist/
COPY docs/ docs/
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
