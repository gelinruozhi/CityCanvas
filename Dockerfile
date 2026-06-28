# --------- Builder Stage ---------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

WORKDIR /app

# 拷贝包定义优先，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# 拷贝源码并构建
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate
RUN pnpm build

# --------- Runner Stage ---------
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# 拷贝 Next.js standalone 输出
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 拷贝 Prisma schema 和 client（运行时需要）
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# SQLite 数据卷挂载点
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
