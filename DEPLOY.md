# CityCanvas 部署指南

> 把项目部署到一台 Linux VPS（推荐配置：2 核 4G、Ubuntu 22.04+），通过 Nginx 反向代理 + Docker 编排。

---

## 一、服务器准备

### 1.1 最小配置
- CPU：2 核
- 内存：≥ 2GB（Next.js build 需要 2GB+）
- 磁盘：≥ 20GB
- 系统：Ubuntu 22.04 / Debian 12 / CentOS 9

### 1.2 安装 Docker + Docker Compose

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo usermod -aG docker $USER  # 重新登录生效

# 验证
docker -v
docker compose version
```

### 1.3 安全组 / 防火墙
开放：22（SSH）、80、443

```bash
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw enable
```

---

## 二、上传代码

```bash
# 方式 A：git clone
git clone https://github.com/<your-username>/CityCanvas.git
cd CityCanvas

# 方式 B：rsync 从本地推
rsync -avz --exclude=node_modules --exclude=.next --exclude=prisma/dev.db \
  ./CityCanvas/ user@your-server:/opt/citycanvas/
```

---

## 三、配置环境变量

在项目根目录创建 `.env` 文件（**不是** `.env.local`，docker-compose 默认读 `.env`）：

```bash
cp .env.example .env
nano .env
```

填入：
```ini
NEXT_PUBLIC_AMAP_KEY=<你的高德 Web 端 Key>
NEXT_PUBLIC_AMAP_SECURITY_CODE=<对应的安全密钥>
AMAP_REST_KEY=<高德 Web 服务 Key>

ANTHROPIC_API_KEY=<你的 Claude API Key>
ANTHROPIC_BASE_URL=https://api.anthropic.com  # 或代理地址

# 可选：模型回退链（逗号分隔）。代理网关通常按 token 绑定可用模型组，
# 报 "model does not exist / Access denied / Free quota exhausted" 时在此调整，无需改代码
ANTHROPIC_MODELS=claude-sonnet-4-6,claude-3-5-sonnet-20241022

# 可选：站点地址（OG/分享卡用），生产填真实域名
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

> ⚠️ **`NEXT_PUBLIC_*` 变量在镜像构建期内联进浏览器 bundle**：docker-compose 会把
> `.env` 里的 `NEXT_PUBLIC_AMAP_KEY` / `NEXT_PUBLIC_AMAP_SECURITY_CODE` 作为 build args
> 传给 `docker compose build`。改动这几个值后必须**重新 build 镜像**才生效；
> 其余变量（`ANTHROPIC_API_KEY` 等）是运行时注入，改完 `docker compose up -d` 重启即可。

---

## 四、首次部署

```bash
# 构建 + 启动（首次构建约 5-10 分钟）
docker compose build
docker compose up -d

# 查看日志
docker compose logs -f app
docker compose logs -f nginx
```

启动后访问 `http://<your-server-ip>` 应该能看到首页。

---

## 五、绑定域名

### 5.1 DNS 解析
在你的域名服务商面板，添加 A 记录指向服务器 IP：
- `@` → `<your-server-ip>`
- `www` → `<your-server-ip>`

### 5.2 修改 Nginx server_name

编辑 `nginx/nginx.conf`，把 `server_name _;` 改成：
```nginx
server_name your-domain.com www.your-domain.com;
```

重启 nginx：
```bash
docker compose restart nginx
```

---

## 六、申请 HTTPS 证书（可选但推荐）

### 6.1 用 Certbot 申请 Let's Encrypt 证书

在**临时停掉 nginx 容器**后用 standalone 模式签发：

```bash
docker compose stop nginx

# 申请证书
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书会签到 /etc/letsencrypt/live/your-domain.com/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/certs/
```

### 6.2 启用 HTTPS

编辑 `nginx/nginx.conf`，取消 `# listen 443 ssl http2;` 等几行的注释，包括 ssl_certificate 路径。

```bash
docker compose up -d
```

### 6.3 自动续签

加入 crontab：
```bash
sudo crontab -e
# 添加：
0 3 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/your-domain.com/*.pem /opt/citycanvas/nginx/certs/ && cd /opt/citycanvas && docker compose restart nginx"
```

---

## 七、常用运维命令

```bash
# 查看运行状态
docker compose ps

# 查看日志（实时滚动）
docker compose logs -f --tail=100 app

# 重启某个服务
docker compose restart app
docker compose restart nginx

# 拉新代码 + 重新构建
git pull
docker compose build app
docker compose up -d

# 停止全部
docker compose down

# 进入容器排查
docker compose exec app sh
docker compose exec app pnpm prisma studio  # 看数据库
```

---

## 八、数据库

### 8.1 默认 SQLite（开箱即用）
- 数据文件挂载在 Docker volume `citycanvas-data`，对应容器内 `/app/data/prod.db`
- 备份：
  ```bash
  docker run --rm -v citycanvas_citycanvas-data:/data -v $(pwd):/backup alpine \
    tar czf /backup/db-$(date +%Y%m%d).tar.gz -C /data .
  ```

### 8.2 切换到 Postgres（生产推荐）

1. 修改 `prisma/schema.prisma`：
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. 在 `docker-compose.yml` 加 db 服务：
   ```yaml
   db:
     image: postgres:16-alpine
     restart: unless-stopped
     environment:
       POSTGRES_USER: citycanvas
       POSTGRES_PASSWORD: <strong-password>
       POSTGRES_DB: citycanvas
     volumes:
       - citycanvas-pg:/var/lib/postgresql/data
     networks: [citycanvas-net]
   ```

3. `.env` 改 `DATABASE_URL=postgresql://citycanvas:<password>@db:5432/citycanvas`

4. `docker compose down && docker compose up -d --build`

5. 进容器跑迁移：
   ```bash
   docker compose exec app pnpm prisma migrate deploy
   ```

---

## 九、故障排查速查

| 现象 | 排查 |
|---|---|
| 浏览器 502 Bad Gateway | `docker compose logs app` 看 Next.js 是否起来；容器反复重启多半是 `prisma db push` 失败，日志里有真实原因 |
| 地图不渲染 | 浏览器 F12 Console 看高德 Key 错误（USERKEY_PLAT_NOMATCH 等） |
| AI 评估报 model does not exist / Access denied / Free quota exhausted | 网关按 token 绑定模型组：调 `.env` 的 `ANTHROPIC_MODELS` 换可用模型；报 Free quota exhausted 需到网关控制台充值或关闭"仅免费模式" |
| AI 评估超时 | 检查 ANTHROPIC_BASE_URL 是否能访问；服务端单模型 30s 超时、客户端 90s 超时、nginx 120s 兜底 |
| 评论/点赞失败 | `docker compose exec app sqlite3 /app/data/prod.db ".tables"` 检查表 |
| 端口被占 | `sudo lsof -i:80` 找占用进程；或改 docker-compose 端口映射 |

---

## 十、本地生产验证（不上 VPS 先跑一遍）

Windows 本地因符号链接权限限制无法产出 standalone 产物，`next.config.ts` 已改为
**BUILD_STANDALONE=1 时才启用 standalone**（Dockerfile 里已设置）：

```bash
# 本地普通生产构建 + 启动（Windows/Linux 通用）
pnpm build && pnpm start   # http://localhost:3000
```

---

## 十、性能调优（可选）

- CPU 较弱的服务器：`docker-compose.yml` 加 `cpus: "1.5"` 限制
- 高并发场景：在 nginx 前加 Cloudflare CDN（仅 DNS 解析切给 CF）
- 数据库慢：切到 Postgres + 加 `_count` 查询的物化缓存

---

部署成功后，把首页 URL 记下来作为 demo 链接，加到 [README.md](README.md) 顶部。
