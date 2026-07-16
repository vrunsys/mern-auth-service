FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY scripts/prepare-husky.js ./scripts/prepare-husky.js

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1 AS production

WORKDIR /app

ENV NODE_ENV=production
ENV HUSKY=0

COPY package.json bun.lock ./

COPY scripts/prepare-husky.js ./scripts/prepare-husky.js

RUN bun install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 5500

CMD ["bun", "dist/server.js"]