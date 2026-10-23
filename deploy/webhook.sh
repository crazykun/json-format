#!/usr/bin/env bash
# ==============================================================================
# 宝塔 WebHook 入口脚本 —— json-format自动部署
#
# 用法（宝塔面板 → WebHook 插件 → 添加 Hook，粘贴本脚本）：
#   粘贴全部内容保存，把面板生成的 Webhook URL 填到 GitHub 仓库
#   Settings → Webhooks → Add webhook，Content type 选 application/json，
#   触发事件选 Release: published。
#
# 优点：不需要 SSH 密钥、不需要在服务器装 node、不需要 git clone，
#       只做「下载 release 包 → 调 deploy.sh」，失败自动重试。
#
# 可在面板 Hook 的「前置脚本」或环境变量里配置：
#   JSONF_REPO      仓库，默认 crazykun/json-format
#   DEPLOY_ROOT     部署根目录
#   DEPLOY_SH       deploy.sh 路径
#   DEPLOY_RETRY    下载重试次数，默认 3
# ==============================================================================

set -uo pipefail

# ------------------------------ 配置 ------------------------------
: "${JSONF_REPO:=crazykun/json-format}"
: "${JSONF_DEPLOY_ROOT:=/www/wwwroot/json-format}"
: "${DEPLOY_SH:=${JSONF_DEPLOY_ROOT}/deploy.sh}"
: "${DEPLOY_RETRY:=3}"
: "${WORK_DIR:=/tmp/jsonf-deploy}"
: "${GITHUB_TOKEN:=}"      # 可选，设置了能提高 API 限额、访问私有仓库

# ------------------------------ 日志 ------------------------------
# 全部走 stdout，不写 stderr。
# 原因：宝塔 WebHook 面板只收集 stdout，写 stderr 的错误日志会整段丢失，
# 表现为「日志停在某一步就没了」，根本看不出哪里失败（实测踩过）。
log()  { echo "[$(date '+%F %T')] $*"; }
warn() { echo "[$(date '+%F %T')] WARN $*"; }
err()  { echo "[$(date '+%F %T')] ERROR $*"; }

# ------------------------------ 幂等锁 ------------------------------
# 防止 GitHub 短时间内重试导致并发部署
LOCK="${WORK_DIR}/deploy.lock"
mkdir -p "$WORK_DIR"
exec 9>"$LOCK"
if ! flock -n 9; then
  log "已有部署在进行中，本次跳过"
  exit 0
fi

# ------------------------------ 1. 查最新 release ------------------------------
log "查询 ${JSONF_REPO} 的最新 release..."
AUTH=()
[[ -n "$GITHUB_TOKEN" ]] && AUTH=(-H "Authorization: token ${GITHUB_TOKEN}")

RELEASE_JSON="$(curl -fsSL --retry 2 --max-time 20 \
  -H 'Accept: application/vnd.github+json' \
  "${AUTH[@]}" \
  "https://api.github.com/repos/${JSONF_REPO}/releases/latest" 2>/dev/null)" || {
  err "调用 GitHub API 失败，检查服务器出网/ DNS"
  exit 1
}

# 用 grep 提取，避免服务器没装 jq
TAG="$(grep -o '"tag_name": *"[^"]*"' <<<"$RELEASE_JSON" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
[[ -z "$TAG" ]] && { err "未能解析 tag_name，GitHub 返回可能变了"; exit 1; }

# 找到该 release 里tar.gz 资产的下载地址
ASSET_URL="$(grep -o '"browser_download_url": *"[^"]*\.tar\.gz"' <<<"$RELEASE_JSON" \
  | head -1 | sed 's/.*"\(https[^"]*\)"$/\1/')"
[[ -z "$ASSET_URL" ]] && { err "release ${TAG} 里没有 .tar.gz 产物"; exit 1; }

log "最新版本: ${TAG}"

# ------------------------------ 2. 幂等：已是当前版本就跳过 ------------------------------
CURRENT="$(basename "$(readlink -f "${JSONF_DEPLOY_ROOT}/current" 2>/dev/null)" 2>/dev/null || echo '')"
if [[ "$CURRENT" == "$TAG" ]]; then
  log "当前已是 ${TAG}，无需部署"
  exit 0
fi
log "当前版本 ${CURRENT:-无} → 目标 ${TAG}"

# ------------------------------ 3. 下载（带重试）------------------------------
TARBALL="/tmp/json-format-${TAG}.tar.gz"
rm -f "$TARBALL"

DL_OK=0
for i in $(seq 1 "$DEPLOY_RETRY"); do
  log "下载产物（第 ${i}/${DEPLOY_RETRY} 次）..."
  if curl -fsSL --retry 2 --max-time 120 --connect-timeout 15 \
       ${GITHUB_TOKEN:+-H "Authorization: token ${GITHUB_TOKEN}"} \
       "$ASSET_URL" -o "$TARBALL"; then
    # 校验是有效 tar.gz，不能拿到错误页当产物
    if tar -tzf "$TARBALL" >/dev/null 2>&1; then
      DL_OK=1
      break
    fi
    warn "下载内容不是有效的 tar.gz，重试"
  fi
  rm -f "$TARBALL"
  sleep $((i * 3))
done

if [[ $DL_OK -ne 1 ]]; then
  err "产物下载失败，已重试 ${DEPLOY_RETRY} 次，线上保持原版本"
  exit 1
fi
log "下载完成: $(du -h "$TARBALL" | cut -f1)"

# ------------------------------ 4. 交给 deploy.sh 做原子部署 ------------------------------
if [[ ! -f "$DEPLOY_SH" ]]; then
  err "找不到部署脚本：${DEPLOY_SH}"
  err "→ 这是最常见的失败原因，请上传一次："
  err "    scp deploy/deploy.sh <用户>@<服务器>:${DEPLOY_SH}"
  err "→ 或在宝塔 WebHook 脚本里显式指定：DEPLOY_SH=/你的路径/deploy.sh"
  err "→ 当前部署根目录：${JSONF_DEPLOY_ROOT}，目录是否存在：$([ -d "$JSONF_DEPLOY_ROOT" ] && echo 是 || echo 否)"
  exit 1
fi
if [[ ! -r "$DEPLOY_SH" ]]; then
  err "部署脚本存在但不可读：${DEPLOY_SH}，检查权限（chmod +x / 属主）"
  exit 1
fi

log "调用 deploy.sh 原子部署（脚本：${DEPLOY_SH}）..."
DEPLOY_ROOT="$JSONF_DEPLOY_ROOT" bash "$DEPLOY_SH" --version "$TAG" --file "$TARBALL"
RC=$?

if [[ $RC -eq 0 ]]; then
  rm -f "$TARBALL"
  log "部署成功：${TAG}"
else
  # deploy.sh 内部已经做过健康检查与回滚，这里只做清理
  warn "deploy.sh 返回 ${RC}，线上仍为原版本（deploy.sh 内部已自动回滚）"
  rm -f "$TARBALL"
fi

exit $RC