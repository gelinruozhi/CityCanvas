# --------- Builder Stage ---------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat openssl
# 项目 package.json 无 packageManager 字段，corepack 无法解析，直接装与锁文件匹配的 pnpm
RUN npm i -g --no-audit --no-fund pnpm@11.9.0

WORKDIR /app

# 拷贝包定义优先，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# 拷贝源码并构建
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* 变量在构建期内联进客户端 bundle，必须经 build args 传入
# （docker-compose.yml 的 build.args 会从 .env 读取并透传）
ARG NEXT_PUBLIC_AMAP_KEY
ARG NEXT_PUBLIC_AMAP_SECURITY_CODE
ENV NEXT_PUBLIC_AMAP_KEY=$NEXT_PUBLIC_AMAP_KEY \
    NEXT_PUBLIC_AMAP_SECURITY_CODE=$NEXT_PUBLIC_AMAP_SECURITY_CODE

RUN pnpm prisma generate
ENV BUILD_STANDALONE=1
RUN pnpm build

# --------- Runner Stage ---------
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma CLI：容器首次启动时执行 db push 建表（SQLite，幂等可重复执行）
RUN npm i -g --no-audit --no-fund prisma@6.19.3

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# 拷贝 Next.js standalone 输出
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 拷贝 Prisma schema（容器首次启动 db push 用）；
# 生成的 client 与 query engine 已包含在 standalone 输出的 .pnpm 目录内，无需额外拷贝
COPY --from=builder /app/prisma ./prisma

# SQLite 数据卷挂载点
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
