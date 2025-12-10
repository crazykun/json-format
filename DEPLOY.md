# 部署指南

本文档介绍如何将 JSON 格式化工具部署到生产环境。

## 📋 部署前检查

```bash
# 1. 确保所有依赖已安装
npm install

# 2. 运行类型检查
npm run lint

# 3. 构建生产版本
npm run build

# 4. 本地预览构建结果
npm run preview
```

## 🚀 部署方式

### 方式一：Vercel（推荐）

最简单快速的部署方式。

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

或者通过 Vercel Dashboard：
1. 导入 GitHub 仓库
2. Vercel 自动检测 Vite 项目
3. 点击部署

### 方式二：Netlify

通过 Netlify CLI 或拖拽部署。

**CLI 部署：**
```bash
# 1. 安装 Netlify CLI
npm i -g netlify-cli

# 2. 登录
netlify login

# 3. 初始化
netlify init

# 4. 部署
netlify deploy --prod
```

**拖拽部署：**
1. 构建项目：`npm run build`
2. 访问 https://app.netlify.com/drop
3. 拖拽 `dist/` 目录

### 方式三：GitHub Pages

通过 GitHub Actions 自动部署。

**1. 创建部署脚本 `.github/workflows/deploy.yml`：**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
```

**2. 启用 GitHub Pages：**
- 仓库 Settings → Pages
- Source 选择 "GitHub Actions"

### 方式四：传统服务器

部署到 Nginx、Apache 等 Web 服务器。

**1. 构建项目：**
```bash
npm run build
```

**2. 上传 dist 目录到服务器：**
```bash
# 使用 SCP
scp -r dist/* user@server:/var/www/html/

# 或使用 rsync
rsync -avz dist/ user@server:/var/www/html/
```

**3. Nginx 配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**4. Apache .htaccess 示例：**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# 启用压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# 设置缓存
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 方式五：Docker

使用 Docker 容器化部署。

**1. 创建 Dockerfile：**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**2. 创建 nginx.conf：**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

**3. 构建和运行：**
```bash
# 构建镜像
docker build -t json-format:2.0.0 .

# 运行容器
docker run -d -p 8080:80 json-format:2.0.0
```

**4. 使用 docker-compose.yml：**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

## 🔧 环境变量配置

如果需要配置 ICP 备案号等信息，在部署前修改 `src/config.ts`：

```typescript
export const config: AppConfig = {
  // ... 其他配置
  icp: {
    number: '京ICP备12345678号-1',
    link: 'https://beian.miit.gov.cn/',
  },
  policeRegistration: {
    number: '京公网安备 11010802012345号',
    link: 'http://www.beian.gov.cn/',
  },
};
```

## 📊 性能优化

### 1. 启用 CDN
将静态资源上传到 CDN，修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: 'https://cdn.example.com/',
  // ...
});
```

### 2. 代码分割
Vite 默认已启用代码分割，Monaco Editor 会被单独打包。

### 3. 压缩优化
生产构建已启用：
- Terser 压缩 JS
- CSS 压缩
- Tree-shaking

### 4. 浏览器缓存
确保服务器配置了正确的缓存头：
- HTML: `no-cache`
- JS/CSS: `max-age=31536000`（一年）
- 图片: `max-age=31536000`

## 🔍 部署后检查

```bash
# 1. 检查构建产物
ls -lh dist/

# 2. 检查 HTML
cat dist/index.html

# 3. 检查资源加载
curl -I https://your-domain.com/

# 4. 性能测试
# 使用 Lighthouse 或 PageSpeed Insights
```

## 🐛 常见问题

### 1. 刷新页面 404
**原因：** SPA 路由未配置
**解决：** 参考上述服务器配置，添加 fallback 到 index.html

### 2. 静态资源加载失败
**原因：** base 路径配置错误
**解决：** 检查 `vite.config.ts` 中的 `base` 配置

### 3. Monaco Editor 加载慢
**原因：** Monaco 文件较大
**解决：**
- 启用 CDN
- 启用 Gzip/Brotli 压缩
- 考虑使用 Web Worker

## 📈 监控和分析

### Google Analytics
在 `index.html` 中添加：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Sentry 错误监控
```bash
npm install @sentry/react
```

在 `src/main.tsx` 中：
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

## 📝 部署清单

- [ ] 更新版本号
- [ ] 运行所有测试
- [ ] 构建生产版本
- [ ] 本地预览验证
- [ ] 检查控制台无错误
- [ ] 测试所有功能
- [ ] 配置环境变量
- [ ] 部署到服务器
- [ ] 验证线上版本
- [ ] 配置监控和分析
- [ ] 更新文档

## 🎉 完成！

部署成功后，访问你的网站验证所有功能正常工作。

需要帮助？查看 [README.md](README.md) 或提交 Issue。
