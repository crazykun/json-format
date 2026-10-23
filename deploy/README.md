# 宝塔面板 + GitHub Actions 自动部署指南

## 整体思路

服务器上不放「当前版本」这一份文件，而是**每个版本一个目录，外加一个 `current` 软链接**：

```
/www/wwwroot/json-format/
├── releases/
│   ├── v2.1.1/← 旧版本（保留 5 个，自动清理更老的）
│   └── v2.1.2/          ← 当前版本
├── current -> releases/v2.1.2← nginx root 指向这里
└── deploy.sh
```

nginx 配置里root 写`current`：

```nginx
root /www/wwwroot/json-format/current;
```

这样部署时**不需要动正在服务的文件**：
- 新版本解压到一个全新目录，物理上与旧版本并存
- 起临时端口验证新版本真的能跑
- 验证通过才改软链接 → `ln -sfn` + `mv -T` 是原子操作，瞬间生效
- 用户请求全程不受影响（没有"删掉旧文件时正好被访问"的窗口）
- 出问题就把软链接指回去，线上立刻恢复

---

## 一、服务器端准备

### 1. 目录与部署用户

```bash
mkdir -p /www/wwwroot/json-format/releases
chown -R www:www /www/wwwroot/json-format
```

### 2. 传脚本

从本地推上去（推荐，之后跟着仓库更新）：

```bash
# 在仓库目录执行
scp deploy/deploy.sh root@你的服务器:/www/wwwroot/json-format/deploy.sh
ssh root@你的服务器 'chmod +x /www/wwwroot/json-format/deploy.sh'
```

或直接在服务器上手动创建：`deploy/deploy.sh` 的内容复制过去即可。

### 3. 改 nginx root（关键一步）

宝塔面板 → 网站 → `json.okkkr.com` → 设置 → 配置文件，把 `root` 改成：

```nginx
root /www/wwwroot/json-format/current;
```

⚠️ 改完点「保存」，宝塔会自己重载 nginx。

**同时把缓存配置加上**（在同一个配置文件里，`server {}` 内）：

```nginx
# 带 hash 的构建产物，内容永不改变
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}

# HTML 不能缓存，保证发版即时生效
location = /index.html {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

### 4. 首次手动部署（建议先验证一次）

```bash
# 在本地打包
cd 仓库目录
npm run build
cd dist && tar -czf ../json-format-v2.1.2.tar.gz --transform 's|^|json-format-v2.1.2/|' *
```

更省事：直接从 GitHub Release 下载已打好的包。

```bash
# 服务器上
cd /tmp
wget https://github.com/crazykun/json-format/releases/download/v2.1.2/json-format-v2.1.2.tar.gz
/www/wwwroot/json-format/deploy.sh --version v2.1.2 --file /tmp/json-format-v2.1.2.tar.gz
```

看到 `OK 部署完成，当前版本 v2.1.2` 就成了。浏览器打开域名确认能正常用，再配自动部署。

### 5. 检查权限

```bash
# 当前部署身份是谁
id
# 测试能否重载 nginx（宝塔 nginx 需要 root 或www 用户权限）
sudo nginx -t && sudo nginx -s reload
```

如果部署脚本不是 root 跑，`nginx -s reload` 可能失败。脚本会打印警告并提示你去面板点重载 —— **不影响文件切换**，只是 nginx 可能还在用旧配置。生产环境建议给部署用户加 sudo 权限：

```bash
# /etc/sudoers.d/deploy
www ALL=(ALL) NOPASSWD: /www/server/nginx/sbin/nginx -s reload
```

---

## 二、GitHub端配置

仓库 → Settings → **Secrets and variables** → Actions → New repository secret：

| Secret 名 | 值 | 说明 |
|---|---|---|
| `SERVER_HOST` | `1.2.3.4` 或 `服务器域名` | 不带协议不带端口 |
| `SERVER_USER` | `root` 或 `www` | 部署身份 |
| `SERVER_SSH_KEY` | SSH 私钥全文 | 见下方生成方法 |
| `DEPLOY_ROOT` | `/www/wwwroot/json-format` | 部署根目录 |
| `KEEP_RELEASES` | `5` | 保留几个历史版本 |
| `SMOKE_URL` | `https://json.okkkr.com/` | 部署后冒烟验证，可留空 |

### 生成 SSH 密钥对

在**本地**执行（不要在服务器上生成）：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/json_format_deploy -N ""
cat ~/.ssh/json_format_deploy          # 整个私钥 →填入 SERVER_SSH_KEY
cat ~/.ssh/json_format_deploy.pub      # 公钥 → 下一步用
```

把公钥传到服务器的 `authorized_keys`：

```bash
ssh root@服务器 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'
ssh root@服务器 'cat >> ~/.ssh/authorized_keys' < ~/.ssh/json_format_deploy.pub
ssh root@服务器 'chmod 600 ~/.ssh/authorized_keys'
```

验证：

```bash
ssh -i ~/.ssh/json_format_deploy root@服务器 'echo 连通 OK'
```

### 关于 environment: production

`deploy.yml` 里用了 `environment: production`，首次运行时会要求在仓库里创建这个 environment（Settings → Environments → New environment）。

好处是可以给它挂审批规则，比如设成「必须手动批准才部署」。不发版就完全不影响 CI。

---

## 三、日常发版流程

```bash
# 本地
git tag v2.1.3 && git push origin v2.1.3
```

或者在 Actions 页面跑 `Release` workflow（`dry_run=false`）。

Release 发布成功后，`Deploy` workflow 会自动触发：

1. 下载 tar.gz
2. SCP 到服务器
3. 服务器解压到 `releases/v2.1.3/`
4. 起临时端口验证首页 + 全部主资源都返回 200
5. 通过 → 原子切换 `current` → 重载 nginx
6. 失败 → 删除新目录，线上仍跑旧版本，workflow 标红
7. GitHub 侧再 curl 一次真实域名做冒烟验证

---

## 四、日常运维命令

```bash
cd /www/wwwroot/json-format

./deploy.sh --list              # 看所有版本，标出当前生效的
./deploy.sh --rollback          # 回滚到上一个版本
./deploy.sh --version v2.1.2 --file /tmp/json-format-v2.1.2.tar.gz   # 手动部署指定版本
```

紧急回滚也可以直接从GitHub Actions 触发（workflow_dispatch → `rollback` 勾 true）。

---

## 五、常见问题

**Q: 部署成功了但线上还是旧页面？**
A: nginx 没重载。宝塔面板 → 软件商店 → Nginx → 「重载配置」。或检查 `current` 软链接是否真的指向新版本。

**Q: 打开页面是 404？**
A: 多半是 nginx `root` 没改成 `current`，或者改完没重载。`curl -I https://你的域名/` 看返回。

**Q: 静态资源 404？**
A: 检查 `releases/v2.1.x/index.html` 和 `assets/` 是否同级目录。压缩包结构必须是：
```
json-format-v2.1.2/index.html
json-format-v2.1.2/assets/*.js
```

**Q: 健康检查一直失败？**
A: 脚本需要 `node` 命令（用来起临时静态服务器）。宝塔环境一般有，若没有：
```bash
ln -s /www/server/nodejs/vXX/bin/node /usr/local/bin/node
```
或设置 `NODE_BIN` 指向实际路径。

**Q: 磁盘满了？**
A: `releases/` 会累积历史版本。`KEEP_RELEASES` 控制保留数量，默认 5。也别忘了 `/tmp` 下传的包可以定期清。

**Q: 能改成 rsync 增量吗？**
A: 静态站点体积小（压缩后1.3MB），全量传更快也更简单可靠，不建议改增量。