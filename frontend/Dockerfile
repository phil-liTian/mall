# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
# 固定 pnpm 9（匹配 lockfileVersion 9.0，且无 pnpm 12 的供应链校验，避免卡死）
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
# 用 npmmirror 国内源加速依赖下载（仅 build stage 生效，不进运行镜像）
ENV npm_config_registry=https://registry.npmmirror.com
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---------- run stage ----------
FROM nginx:1.27-alpine
# 默认用生产 nginx.conf；本地 compose 传 NGINX_CONF=nginx.local.conf 覆盖
ARG NGINX_CONF=nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
EXPOSE 80 443
