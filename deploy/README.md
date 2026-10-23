# 自动部署指南（json-format）

两种方案，**推荐方案一**。

| | 方案一：宝塔 WebHook | 方案二：Actions SSH |
|---|---|---|
| 需要 SSH 密钥 | 不需要 | 需要 |
| 需要配GitHub Secrets | 不需要 | 需要 6 个 |
| 服务器要装 node | 不需要 | 不需要 |
| 服务器要git clone | 不需要 | 不需要 |
| 配置耗时 | 约 5 分钟 | 约 20 分钟 |
| 部署耗时 | 约 10 秒 | 约 30 秒 |
| 适用| **宝塔面板用户** | 非宝塔 / 不便开 webhook 入口 |

两者共用同一份 `deploy/deploy.sh`，按需二选一即可。

---

## 共同前提：目录结构与 nginx 配置

不管用哪个方案，都要先做这一步。

### 目录结构

```
/www/wwwroot/json.okkkr.com/
├── deploy/
│   └── deploy.sh           ← deploy/deploy.sh 上传到这里
├── releases/              ← 各版本目录，自动管理
│   ├── v2.1.1/            ← 旧版本（保留 5 个）
│   └── v2.1.2/            ← 当前版本
└── current -> releases/v2.1.2   ← nginx root 指向这里
```

### nginx root 改成 current（关键）

宝塔面板 → 网站 → `json.okkkr.com` → **设置 → 配置文件**，把 `root` 改成：

```nginx
root /www/wwwroot/json.okkkr.com/current;
```

⚠️ **这一步不做，部署了也不会生效** —— nginx 还在读旧路径。改完点「保存」，宝塔会自己重载。

顺带把缓存配置加上（同一个配置文件，`server {}` 内）：

```nginx
# 带 hash 的构建产物，内容永不改变，可永久缓存
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}

# HTML 不能缓存，保证发版即时生效
location = /index.html {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

### 上传 deploy.sh

```bash
# 本地仓库目录执行
ssh root@你的服务器 'mkdir -p /www/wwwroot/json.okkkr.com/releases /www/wwwroot/json.okkkr.com/deploy'
scp deploy/deploy.sh root@你的服务器:/www/wwwroot/json.okkkr.com/deploy/
ssh root@你的服务器 'chmod +x /www/wwwroot/json.okkkr.com/deploy/deploy.sh'
```

也可以只上传一次，让脚本以后跟着仓库更新：

```bash
# 把 deploy.sh 从仓库 raw 地址拉下来
ssh root@你的服务器 \
  'mkdir -p /www/wwwroot/json.okkkr.com/deploy && \
   curl -fsSL https://raw.githubusercontent.com/crazykun/json-format/main/deploy/deploy.sh \
     -o /www/wwwroot/json.okkkr.com/deploy/deploy.sh && \
   chmod +x /www/wwwroot/json.okkkr.com/deploy/deploy.sh'
```

---

## 方案一：宝塔 WebHook（推荐）

### 原理

```
git push tag → GitHub 生成 Release → GitHub 主动 POST 到你的面板 URL
→ 宝塔执行 webhook.sh → 下载 release 包 → deploy.sh 原子切换
```

**不需要 SSH 密钥，不需要 Secrets，不需要服务器装 node。** 整套就是「下载 + 解压 + 切软链接」。

### 步骤 1：安装 WebHook 插件

宝塔面板 → 软件商店 → 搜索「Webhook」→ 安装。
（如果你是用「Git 创建」方式建站的，这插件会自动装好。）

### 步骤 2：添加 Hook，粘贴脚本

面板左侧 → **WebHook** → 添加 Hook：

- **Hook 名称**：`json-format-deploy`
- **执行脚本**：粘贴 `deploy/webhook.sh` 的全部内容

脚本开头有一大段注释，粘贴时可以保留（方便日后对照）。

### 步骤 3：复制 Webhook URL

添加完会生成一个类似这样的地址：

```
http://你的服务器IP:8888/hook?access_key=xxxxxxxx
```

⚠️ **这个 URL 等同于密码**，不要提交到公开仓库、别发到群里。谁拿到谁就能触发部署（虽然只能部署官方 release，风险有限，但会浪费流量）。

### 步骤 4：GitHub 仓库添加 Webhook

仓库 → **Settings → Webhooks → Add webhook**：

| 字段 | 值 |
|---|---|
| Payload URL | 粘贴上面复制的宝塔 URL |
| Content type | `application/json` |
| SSL verification | 面板有 SSL 就选 Enable，否则 Disable |

**Payload URL 填好后会默认勾选 Push 事件，把 Push 取消掉**，改为只勾：

> ☑ **Release: published**

这样只有发版才触发，普通提交不会碰服务器。

（想改成tag 推送就触发，也可以勾 `Push`，但注意 tag push 时 Release 还没生成完，可能拉到旧包。推荐 Release。）

### 步骤 5：测试

在仓库 → Actions 手动跑一次 `Release`（`dry_run=false`），发个新 tag。等release 生成后：

- 宝塔面板 → WebHook → 点你的 Hook 看**执行日志**
- GitHub 仓库 → Settings → Webhooks → **Recent Deliveries** 看是否 200

### 步骤 6：确认部署身份

宝塔的 webhook 进程可能以 `www` 或 `root` 身份执行。检查：

```bash
# 触发一次部署后，看日志里有没有 nginx reload 失败
```

如果看到：

```
WARN nginx reload 未成功，请在宝塔面板点「重载配置」
```

说明文件已切换成功，只是 nginx 还没重载。两个办法：

1. **简单**：以后每次部署完在面板点一下「Nginx → 重载配置」（不优雅但够用）
2. **彻底**：给部署用户加sudo 权限
   ```bash
   # /etc/sudoers.d/jsonfmt
   www ALL=(ALL) NOPASSWD: /www/server/nginx/sbin/nginx -s reload
   ```

> 注意：`deploy.sh` 里 nginx 重载失败**不会导致部署失败**，也不会触发回滚——
> 因为文件本身已经原子切换好了，只是 nginx 还没重新加载配置。这是有意设计的，
> 避免把「权限问题」误判成「部署失败」。

---

## 方案二：GitHub Actions SSH 直连

适合不用宝塔，或不方便开放 webhook 入口的情况。

### 1. 生成 SSH 密钥对

在**本地**执行：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/json_format_deploy -N ""
cat ~/.ssh/json_format_deploy          # 整个私钥 → 填入 SERVER_SSH_KEY
cat ~/.ssh/json_format_deploy.pub      # 公钥 → 下一步用
```

公钥传到服务器：

```bash
ssh root@服务器 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'
ssh root@服务器 'cat >> ~/.ssh/authorized_keys' < ~/.ssh/json_format_deploy.pub
ssh root@服务器 'chmod 600 ~/.ssh/authorized_keys'
ssh -i ~/.ssh/json_format_deploy root@服务器 'echo 连通 OK'   # 验证
```

### 2. 配置 Secrets

仓库 → Settings → **Secrets and variables** → Actions → New repository secret：

| Secret 名 | 值 |
|---|---|
| `SERVER_HOST` | `1.2.3.4` 或服务器域名（不带协议） |
| `SERVER_USER` | `root` 或 `www` |
| `SERVER_SSH_KEY` | 上一步的私钥全文 |
| `DEPLOY_ROOT` | `/www/wwwroot/json.okkkr.com` |
| `KEEP_RELEASES` | `5` |
| `SMOKE_URL` | `https://json.okkkr.com/`（可留空） |

### 3. 启用 workflow

`.github/workflows/deploy.yml` 里的 `if: false` 改成 `if: true`，或直接删掉那一行。

### 4.关于 environment

用了 `environment: production`，首次运行会要求在Settings → Environments 创建它。
建议挂个「手动批准」规则，发版和上线分开控制。

---

## 日常发版

```bash
git tag v2.1.3 && git push origin v2.1.3
```

或者 Actions 页面跑 `Release` workflow（`dry_run=false`）。

之后全自动：Release 生成 → webhook 触发 → 下载 → 健康检查 → 原子切换 → reload。

**部署失败时线上不受影响**，仍是旧版本，GitHub 会看到部署失败。

---

## 日常运维

```bash
cd /www/wwwroot/json.okkkr.com

./deploy/deploy.sh --list              # 看所有版本，标出当前生效的
./deploy/deploy.sh --rollback          # 回滚到上一个版本
```

紧急回滚也可以直接重新触发 webhook —— 但注意脚本是「追最新版」的，
要回滚得手动跑上面那条 `--rollback`。

---

## deploy.sh 做了什么

| 能力 | 说明 |
|---|---|
| 健康检查才切换 | 解压到全新目录，起临时端口实测首页+ 全部主资源 HTTP 200，任一 404 即判定坏版本 |
| 原子切换 | `ln -sfn` + `mv -T`，瞬时完成，不存在「删旧文件时正好被访问」的窗口 |
| 自动回滚 | nginx 重载失败时软链接指回旧版本 |
| 版本号校验 | 白名单匹配，挡住 `../../etc` 这类路径穿越 |
| 自动清理 | 按 mtime 保留最近 N 个（不是按目录名，`v2.1.10` vs `v2.1.9` 会排错） |
| 幂等 | 同一版本重复部署会先清干净旧目录再解 |

webhook.sh 额外做了：

| 能力 | 说明 |
|---|---|
| 幂等跳过 | 当前已是最新版本直接退出，不重复部署 |
| 并发锁 | `flock` 防GitHub 超时重试导致并发部署 |
| 下载重试 | 失败重试 3 次，且校验是不是有效 tar.gz（防把错误页当产物） |
| 产物校验 | `tar -tzf` 验证，否则重试 |

---

## 常见问题

**Q: 部署成功了但线上还是旧页面？**
A: nginx 没重载。宝塔 → 软件商店 → Nginx → 「重载配置」。日志里有 `WARN nginx reload 未成功` 就是这个情况。

**Q: 打开页面 404？**
A: nginx `root` 没改成 `current`，或改完没重载。`curl -I https://你的域名/` 看返回。

**Q: 静态资源 404？**
A: 检查目录层级对不对。正确结构是：
```
releases/v2.1.2/index.html
releases/v2.1.2/assets/*.js
```
`index.html` 和 `assets/` 必须是同级。

**Q: webhook 一直不触发？**
A: 查 GitHub Settings → Webhooks → Recent Deliveries，红色说明请求失败。
若是 404/403，多半是 URL 错了或 access_key 不匹配。

**Q: webhook 触发了但日志报 GitHub API 失败？**
A: 服务器出网问题，或 API 限额耗尽。检查 `curl -I https://api.github.com` 通不通。
私有仓库需在脚本里设 `GITHUB_TOKEN`。

**Q: 健康检查一直失败？**
A: `deploy.sh` 需要 `node` 命令（起临时静态服务器用）。宝塔一般有，
若没有：`ln -s /www/server/nodejs/vXX/bin/node /usr/local/bin/node`，
或在脚本里设 `NODE_BIN` 指向实际路径。

**Q: 磁盘满了？**
A: `releases/` 会累积历史版本，`KEEP_RELEASES` 控制保留数量（默认 5）。
`/tmp` 下临时包已自动清理。

**Q: 能改成 rsync 增量吗？**
A: 不建议。静态站点压缩后只有 1.3MB，全量传更快也更简单可靠。