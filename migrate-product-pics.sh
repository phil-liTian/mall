#!/usr/bin/env bash
# ============================================================
# 把 pms_product 的 pic / album_pics 从阿里云 OSS 图床
# 刷到自建 MinIO（http://mall.starchase.xyz/mall-files/mall/...）
#
# 在【服务器 111.228.13.106】的 /opt/mall 下执行：bash migrate-product-pics.sh
# 做的事：备份表 → 收集所有 OSS 图 URL → 下载 → 灌进 mall-minio 容器的 mall bucket
#         → 回写数据库前缀（OSS → mall.starchase.xyz/mall-files）
#
# 幂等：已是 mall.starchase.xyz 的地址会被跳过；重复跑不会重复下载已存在的对象。
# ============================================================
set -euo pipefail

# ===== 配置 =====
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS='O1l(8DA2N_'
DB_NAME=mall

OSS_PREFIX="http://macro-oss.oss-cn-shenzhen.aliyuncs.com/"   # 原图床前缀（含末尾 /）
NEW_PREFIX="http://mall.starchase.xyz/mall-files/"            # 新前缀（含末尾 /）
BUCKET=mall                                                   # MinIO bucket
MINIO_CONTAINER=mall-minio
WORKDIR=/opt/mall/pic-migrate
# ================

run_mysql() { MYSQL_PWD="${DB_PASS}" mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} ${DB_NAME} -N -s "$@"; }

echo "==> [1/6] 备份 pms_product 表"
mkdir -p "${WORKDIR}"
BACKUP="${WORKDIR}/pms_product.backup.$(date +%Y%m%d%H%M%S).sql"
MYSQL_PWD="${DB_PASS}" mysqldump -h${DB_HOST} -P${DB_PORT} -u${DB_USER} ${DB_NAME} pms_product > "${BACKUP}"
echo "    备份已存：${BACKUP}"

echo "==> [2/6] 收集所有待迁移的 OSS 图片 URL（pic + album_pics，去重）"
# pic 单张 + album_pics 逗号拆分，只保留 OSS 前缀的
run_mysql -e "SELECT pic FROM pms_product WHERE pic LIKE '${OSS_PREFIX}%';" > "${WORKDIR}/urls.raw"
run_mysql -e "SELECT album_pics FROM pms_product WHERE album_pics LIKE '%${OSS_PREFIX}%';" \
  | tr ',' '\n' >> "${WORKDIR}/urls.raw"
grep -E "^${OSS_PREFIX}" "${WORKDIR}/urls.raw" | sed 's/[[:space:]]*$//' | sort -u > "${WORKDIR}/urls.txt"
TOTAL=$(wc -l < "${WORKDIR}/urls.txt" | tr -d ' ')
echo "    去重后待处理图片：${TOTAL} 张"

echo "==> [3/6] 下载图片到本地（保持 OSS 后的路径结构）"
DL_DIR="${WORKDIR}/files"
mkdir -p "${DL_DIR}"
fail=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  key="${url#${OSS_PREFIX}}"          # 去掉前缀 → mall/images/日期/文件名
  dest="${DL_DIR}/${key}"
  mkdir -p "$(dirname "$dest")"
  if [ -f "$dest" ]; then continue; fi
  if curl -fsS -o "$dest" "$url"; then
    echo "    ok  $key"
  else
    echo "    !! 下载失败：$url"
    fail=$((fail+1))
  fi
done < "${WORKDIR}/urls.txt"
[ "$fail" -eq 0 ] || echo "    ⚠️ 有 ${fail} 张下载失败，见上方 !! 行"

echo "==> [4/6] 把文件灌进 ${MINIO_CONTAINER} 容器并上传到 bucket=${BUCKET}"
# key 形如 mall/images/... ，其中第一段 mall 就是 bucket；上传时对象 key 去掉这段
docker cp "${DL_DIR}/." "${MINIO_CONTAINER}:/tmp/pic-migrate/"
docker exec "${MINIO_CONTAINER}" sh -c '
  set -e
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
  mc mb -p local/'"${BUCKET}"' 2>/dev/null || true
  # /tmp/pic-migrate/mall/images/... → 上传到 local/mall/images/...
  mc cp --recursive /tmp/pic-migrate/'"${BUCKET}"'/ local/'"${BUCKET}"'/
  rm -rf /tmp/pic-migrate
'
echo "    上传完成"

echo "==> [5/6] 回写数据库：把 OSS 前缀替换为新前缀"
run_mysql -e "
  UPDATE pms_product SET pic = REPLACE(pic, '${OSS_PREFIX}', '${NEW_PREFIX}')
    WHERE pic LIKE '${OSS_PREFIX}%';
  UPDATE pms_product SET album_pics = REPLACE(album_pics, '${OSS_PREFIX}', '${NEW_PREFIX}')
    WHERE album_pics LIKE '%${OSS_PREFIX}%';
"
echo "    数据库已更新"

echo "==> [6/6] 校验：还剩多少 OSS 地址（应为 0），抽查一条新地址能否访问"
REMAIN=$(run_mysql -e "
  SELECT
    (SELECT COUNT(*) FROM pms_product WHERE pic LIKE '%macro-oss%')
  + (SELECT COUNT(*) FROM pms_product WHERE album_pics LIKE '%macro-oss%');
")
echo "    残留 OSS 地址数：${REMAIN}（期望 0）"
SAMPLE=$(run_mysql -e "SELECT pic FROM pms_product WHERE pic LIKE '${NEW_PREFIX}%' LIMIT 1;")
if [ -n "$SAMPLE" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$SAMPLE")
  echo "    抽查 ${SAMPLE} -> HTTP ${code}（期望 200）"
fi

echo ""
echo "==> 迁移完成。若结果异常，可用备份还原："
echo "    mysql -h${DB_HOST} -u${DB_USER} -p ${DB_NAME} < ${BACKUP}"
