#!/usr/bin/env bash
# ==============================================================================
# json-format 原子部署脚本（宝塔 / 任意 Linux + nginx 环境）
#
# 设计要点：
#   1. 版本目录物理并存，nginx root 指向 current 软链接
#      -> 切换版本 = 改软链接，瞬时完成，无"删旧版时正在被访问"的窗口
#   2. 新版本先起临时端口做健康检查，通过了才切
#      -> 坏版本永远碰不到线上
#   3. 健康检查失败或切换后异常，自动把软链接指回旧版本
#   4. 只保留最近 N 个版本，自动清理旧的
#
# 用法：
#   deploy.sh --version v2.1.3 --file /tmp/json-format-v2.1.3.tar.gz
#   deploy.sh --version v2.1.3 --rollback          # 手动回滚到上一个版本
#   deploy.sh --list# 列出所有版本
#
# 建议通过 GitHub Actions 调用，也可以手动 SSH 上来执行。
# ==============================================================================

set -Eeuo pipefail

# ------------------------------ 配置区（可用环境变量覆盖）------------------------------
: "${DEPLOY_ROOT:=/www/wwwroot/json-format}"      # 部署根目录
: "${RELEASES_DIR:=${DEPLOY_ROOT}/releases}"      # 各版本目录
: "${CURRENT_LINK:=${DEPLOY_ROOT}/current}"       # nginx root 指向的软链接
: "${KEEP_RELEASES:=5}"                           # 保留最近几个版本
: "${HEALTH_PORT:=18099}"                         # 健康检查临时端口
: "${HEALTH_TIMEOUT:=15}"                         # 健康检查超时秒数
: "${NODE_BIN:=node}"                             # 用 node 起静态服务器做健康检查
#nginx 可执行路径：宝塔在/www/server/nginx/sbin/nginx，系统 nginx 在 /usr/sbin/nginx
: "${NGINX_BIN:=}"

# ------------------------------ 参数解析 ------------------------------
VERSION=""
TARBALL=""
ROLLBACK=0
LIST=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version) VERSION="${2:-}"; shift 2 ;;
    --file)    TARBALL="${2:-}"; shift 2 ;;
    --rollback) ROLLBACK=1; shift ;;
    --list)     LIST=1; shift ;;
    -h|--help)  sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "未知参数: $1"; exit 2 ;;
  esac
done

# ------------------------------ 日志 ------------------------------
# 记录切换前的版本，供 nginx_reload / 回滚逻辑取用（必须是全局，函数内要读）
old_ver=""

log()  { printf '\033[0;36m[%s] %s\033[0m\n' "$(date '+%F %T')" "$*"; }
warn() { printf '\033[0;33m[%s] WARN %s\033[0m\n' "$(date '+%F %T')" "$*"; }
# 注意：错误一律输出到 stdout 而不是 stderr。
# 宝塔 WebHook 面板只收集 stdout，写 stderr 的内容会整段丢失，
# 现象是「日志停在某一步就没了」，完全看不出失败原因（实测踩过）。
err()  { printf '\033[0;31m[%s] ERROR %s\033[0m\n' "$(date '+%F %T')" "$*"; }
ok()   { printf '\033[0;32m[%s] OK %s\033[0m\n' "$(date '+%F %T')" "$*"; }

# ------------------------------ 工具函数 ------------------------------
find_nginx() {
  if [[ -n "$NGINX_BIN" ]]; then echo "$NGINX_BIN"; return; fi
  for c in /www/server/nginx/sbin/nginx /usr/sbin/nginx /usr/local/nginx/sbin/nginx; do
    [[ -x "$c" ]] && { echo "$c"; return; }
  done
  echo ""
}

# nginx -t 通过时才 reload，避免配置写错把站点搞挂。
#
# 注意：`nginx -t` 在非 root 身份下会因为打不开 /run/nginx.pid 而以
# [emerg] 退出，但此时配置语法其实是通过的（日志里有 "syntax is ok"）。
# 不能只看退出码，否则会把「权限不足」误判成「配置写错」而触发假回滚。
nginx_reload() {
  local bin
  bin="$(find_nginx)"
  if [[ -z "$bin" ]]; then
    warn "未找到 nginx 可执行文件，跳过 reload（若用宝塔请在面板里重载）"
    return 0
  fi

  local out rc
  out="$("$bin" -t 2>&1)" && rc=0 || rc=$?

  if [[ $rc -eq 0 ]]; then
    :
  elif grep -q 'syntax is ok' <<<"$out" && grep -qi 'permission denied\|Operation not permitted' <<<"$out"; then
    warn "nginx -t 因权限不足返回非零，但语法校验通过（需要 root 才能写 pid），继续 reload"
  else
    err "nginx 配置校验失败，保持现状不动："
    printf '%s\n' "$out"
    return 1
  fi

  # reload 同理：部分环境非 root 也会失败，此时静默跳过并提示走面板重载，
  # 不能因此判定部署失败。
  if "$bin" -s reload 2>>/tmp/nginx_reload.log; then
    ok "nginx 已平滑重载（零中断）"
  elif [[ -n "$old_ver" ]]; then
    warn "nginx reload 未成功（非 root 权限常见）。若线上未生效，请在宝塔面板点「重载配置」，"
    warn "或用 sudo 执行本脚本。文件已就位，切换本身已完成。"
  else
    warn "nginx reload 未成功，请在宝塔面板点「重载配置」"
  fi
  return 0
}

current_version() {
  if [[ -L "$CURRENT_LINK" ]]; then
    basename "$(readlink -f "$CURRENT_LINK")"
  else
    echo ""
  fi
}

# 用临时端口起一个静态服务器验证新版本真的能跑起来。
# 只 curl 首页意义有限—— 真正要验证的是 JS/CSS 资源都能取到，
# 所以这里额外检查 index.html 里引用的主资源。
health_check() {
  local dir="$1"
  log "健康检查：$dir"

  if [[ ! -f "$dir/index.html" ]]; then
    err "缺少 index.html，判定为坏版本"
    return 1
  fi

  # 从 index.html 里抠出主 JS/CSS 路径，确认这些文件真实存在。
  # 这一步能挡住「只解压了一半」「assets 目录名不对」这类低级错误。
  # 引号要同时吃双引号和单引号，vite 产物是双引号，但换构建工具就可能是单引号。
  local refs missing=0
  refs="$(grep -oE "(src|href)=[\"'][^\"']+[\"']" "$dir/index.html" \
          | grep -oE "/assets/[^\"']+" | sed "s/[\"']//g" | sort -u || true)"
  if [[ -z "$refs" ]]; then
    err "index.html 里解析不到任何 /assets/ 引用，判定为坏版本"
    return 1
  fi

  while read -r ref; do
    [[ -z "$ref" ]] && continue
    if [[ ! -f "${dir}${ref}" ]]; then
      err "index.html 引用了 ${ref}，但文件不存在"
      missing=1
    fi
  done <<< "$refs"

  # 这里必须显式 return：上面 if 块内的失败标记不会自动中断函数，
  # 少这一行会让坏版本被当成好版本放行（实测踩过）。
  if [[ $missing -ne 0 ]]; then
    err "有 ${missing} 个资源缺失，判定为坏版本"
    return 1
  fi
  ok "index.html 引用的 $(printf '%s\n' "$refs" | wc -l | tr -d ' ') 个资源均存在"

  # 起临时静态服务器实测 HTTP响应
  if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
    warn "找不到 $NODE_BIN，跳过 HTTP 实测（资源存在性已校验）"
    return 0
  fi

  local pid=""
  "$NODE_BIN" -e "
    const http=require('http'),fs=require('fs'),p=require('path');
    const root=${dir@Q};
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ico':'image/x-icon','.ttf':'font/ttf','.json':'application/json'};
    http.createServer((q,s)=>{
      let f=p.join(root,decodeURIComponent(q.url.split('?')[0]));
      if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=p.join(f,'index.html');
      if(!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}
      s.writeHead(200,{'Content-Type':types[p.extname(f)]||'application/octet-stream'});
      fs.createReadStream(f).pipe(s);
    }).listen(${HEALTH_PORT});
  " >/tmp/health_srv.log 2>&1 &
  pid=$!

  local code=000 i=0
  while [[ $i -lt $HEALTH_TIMEOUT ]]; do
    if ! kill -0 "$pid" 2>/dev/null; then
      err "临时服务器启动失败："
      cat /tmp/health_srv.log || true
      return 1
    fi
    code="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${HEALTH_PORT}/index.html" 2>/dev/null || echo 000)"
    [[ "$code" == "200" ]] && break
    sleep 1
    i=$((i + 1))
  done

  if [[ "$code" != "200" ]]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    err "健康检查未通过，index.html HTTP 状态码 ${code}（超时 ${HEALTH_TIMEOUT}s）"
    return 1
  fi

  # 首页 200 不代表资源能取到（路径写错、mimetype 不对都会 404）。
  # 逐个请求 index.html 引用到的主资源，确认真的能下载。
  # 注意必须在kill 临时服务器之前做。
  local ref rcode bad_ref=0
  while read -r ref; do
    [[ -z "$ref" ]] && continue
    rcode="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${HEALTH_PORT}${ref}" 2>/dev/null || echo 000)"
    if [[ "$rcode" != "200" ]]; then
      err "资源实测失败 ${ref} -> HTTP ${rcode}"
      bad_ref=1
    fi
  done <<< "$refs"

  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true

  if [[ $bad_ref -ne 0 ]]; then
    err "有资源无法正常访问，判定为坏版本"
    return 1
  fi

  ok "健康检查通过（首页 + 全部主资源均为 HTTP 200）"
  return 0
}

switch_to() {
  local target="$1"
  # ln -sfn 保证原子替换：先建临时链接再 rename，避免中间出现链接不存在
  ln -sfn "$target" "${CURRENT_LINK}.new"
  mv -Tf "${CURRENT_LINK}.new" "$CURRENT_LINK"
}

cleanup_old() {
  local keep_current
  keep_current="$(current_version)"
  # 必须按 mtime 倒序，不能按目录名sort。
  # 版本名 v2.1.10 和 v2.1.9 按名字排会得出错误顺序，
  # 同分钟内连续部署更是完全排不出来。
  local -a names=() mtimes=()
  local d
  while IFS= read -r d; do
    [[ -n "$d" ]] || continue
    names+=("$d")
    mtimes+=("$(stat -c %Y "$RELEASES_DIR/$d" 2>/dev/null || echo 0)")
  done < <(find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' 2>/dev/null)

  # 生成 "mtime<TAB>name" 后按数值倒序排
  local -a pairs=()
  local i
  for i in "${!names[@]}"; do
    pairs+=("${mtimes[$i]}"$'\t'"${names[$i]}")
  done
  mapfile -t pairs < <(printf '%s\n' "${pairs[@]}" | sort -rn)

  local idx=0 name
  for line in "${pairs[@]}"; do
    idx=$((idx + 1))
    name="${line#*$'\t'}"
    if [[ $idx -gt $KEEP_RELEASES && "$name" != "$keep_current" ]]; then
      rm -rf "${RELEASES_DIR:?}/${name:?}"
      log "清理旧版本 ${name}"
    fi
  done
}

list_versions() {
  echo "部署根目录: ${DEPLOY_ROOT}"
  echo "当前版本:   $(current_version || echo '（未设置）')"
  echo ""
  echo "已部署版本:"
  if [[ -d "$RELEASES_DIR" ]]; then
    local cur
    cur="$(current_version)"
    local d
    while IFS= read -r d; do
      local stamp mark
      stamp="$(stat -c %y "$RELEASES_DIR/$d" 2>/dev/null | cut -c1-16)"
      mark=""
      [[ "$d" == "$cur" ]] && mark="  <- 当前生效"
      printf '  %-14s %s%s\n' "$d" "$stamp" "$mark"
    done < <(find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r)
  else
    echo "  （空）"
  fi
}

do_rollback() {
  local cur prev target
  cur="$(current_version)"
  [[ -z "$cur" ]] && { err "当前没有生效版本，无从回滚"; return 1; }
  prev="$(find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' 2>/dev/null \
    | grep -v "^${cur}$" | sort -r | head -1)"
  if [[ -z "$prev" ]]; then
    err "只剩 ${cur} 一个版本，没有可回滚的目标"
    return 1
  fi
  target="${RELEASES_DIR}/${prev}"
  warn "当前 ${cur}，准备回滚到 ${prev}"
  health_check "$target" || { err "回滚目标自身不健康，中止回滚（保持 ${cur}）"; return 1; }
  switch_to "$target"
  nginx_reload || return 1
  ok "已回滚到 ${prev}"
}

# ------------------------------ 主流程 ------------------------------
main() {
  if [[ $LIST -eq 1 ]]; then list_versions; return 0; fi

  mkdir -p "$RELEASES_DIR"

  if [[ $ROLLBACK -eq 1 ]]; then do_rollback; return $?; fi

  if [[ -z "$VERSION" || -z "$TARBALL" ]]; then
    err "缺少 --version 或 --file 参数"
    exit 2
  fi
  if [[ ! -f "$TARBALL" ]]; then
    err "压缩包不存在: $TARBALL"
    exit 2
  fi
  # 版本号做白名单校验，防止路径穿越（../../etc 那种）
  if ! [[ "$VERSION" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+([-+.][0-9A-Za-z.+-]+)?$ ]]; then
    err "版本号格式非法: $VERSION"
    exit 2
  fi

  local new_dir
  old_ver="$(current_version)"
  new_dir="${RELEASES_DIR}/${VERSION}"

  log "开始部署 ${VERSION}（当前版本: ${old_ver:-无}）"

  # 同一版本重复部署：先删掉旧的再解，避免残留上次的脏文件
  if [[ -d "$new_dir" ]]; then
    warn "版本目录已存在，先清理: ${new_dir}"
    rm -rf "$new_dir"
  fi

  log "解压到 ${new_dir}"
  mkdir -p "$new_dir"
  # tar 里带一层 json-format-vX.Y.Z/ 顶层目录，用 --strip-components=1 剥掉
  tar -xzf "$TARBALL" -C "$new_dir" --strip-components=1

  if [[ ! -f "$new_dir/index.html" ]]; then
    err "解压后没有 index.html，压缩包结构可能不对（需要顶层目录 + assets/）"
    exit 1
  fi

  # 这一步决定了"坏版本碰不到线上"
  if ! health_check "$new_dir"; then
    err "健康检查失败，放弃部署 ${VERSION}，线上仍为 ${old_ver:-无}"
    rm -rf "$new_dir"
    exit 1
  fi

  log "切换 current -> ${VERSION}"
  switch_to "$new_dir"

  if ! nginx_reload; then
    err "nginx 重载失败，自动回滚到 ${old_ver}"
    if [[ -n "$old_ver" && -d "${RELEASES_DIR}/${old_ver}" ]]; then
      switch_to "${RELEASES_DIR}/${old_ver}"
      nginx_reload || true
    fi
    exit 1
  fi

  ok "部署完成，当前版本 ${VERSION}"
  log "线上验证: curl -sI https://<你的域名>/ | head -1"

  cleanup_old
}

trap 'err "脚本在第 $LINENO 行中断"' ERR
main "$@"