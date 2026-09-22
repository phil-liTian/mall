#!/usr/bin/env bash
# ------------------------------------------------------------------
# 营销(SMS)/专题(CMS)后端接口移植脚本
# 从参考工程 0resource/mall(com.macro.mall)复制到本工程(com.phil.mall)
# 变换:
#   1) 包名/引用 com.macro.mall -> com.phil.mall(含 XML namespace/type)
#   2) 去除 springfox 注解与 import(@Api/@ApiOperation/@ApiModel/@ApiModelProperty
#      及 import io.swagger.annotations.*),保留 springdoc 的 @Tag(io.swagger.v3.*)
# 说明:执行环境限制导致无法在 Claude 侧运行 cp/sed,故由本脚本在你本机完成机械复制,
#      随后再由 Claude 修正残余编译问题。
# 用法:  bash mall/Backend/port-sms-cms.sh
# 依赖:  macOS 自带 bash + BSD sed(脚本已按 BSD sed 语法 `sed -i ''` 编写)
# ------------------------------------------------------------------
set -euo pipefail

SRC="/Users/litian.phil/phil/java/0resource/mall"
TGT="/Users/litian.phil/phil/java/mall/Backend"

SRC_MODEL="$SRC/mall-mbg/src/main/java/com/macro/mall/model"
SRC_MAPPER="$SRC/mall-mbg/src/main/java/com/macro/mall/mapper"
SRC_XML="$SRC/mall-mbg/src/main/resources/com/macro/mall/mapper"
SRC_ADM="$SRC/mall-admin/src/main/java/com/macro/mall"
SRC_DAOXML="$SRC/mall-admin/src/main/resources/dao"

TGT_MODEL="$TGT/mall-mbg/src/main/java/com/phil/mall/model"
TGT_MAPPER="$TGT/mall-mbg/src/main/java/com/phil/mall/mapper"
TGT_XML="$TGT/mall-mbg/src/main/resources/com/phil/mall/mapper"
TGT_ADM="$TGT/mall-admin/src/main/java/com/phil/mall"
TGT_DAOXML="$TGT/mall-admin/src/main/resources/dao"

mkdir -p "$TGT_MODEL" "$TGT_MAPPER" "$TGT_XML" \
         "$TGT_ADM/controller" "$TGT_ADM/service/impl" "$TGT_ADM/dto" "$TGT_ADM/dao" \
         "$TGT_DAOXML"

# 复制的目标文件清单(用于随后统一 sed)
COPIED=()

copy() { # $1=src file  $2=dst file
  if [[ ! -f "$1" ]]; then
    echo "!! 缺失源文件: $1" >&2
    MISSING+=("$1")
    return
  fi
  cp "$1" "$2"
  COPIED+=("$2")
}

MISSING=()

# ---- mall-mbg: model + Example + Mapper + XML(11 张表)----
ENTITIES=(SmsCoupon SmsCouponHistory SmsCouponProductRelation SmsCouponProductCategoryRelation \
          SmsFlashPromotion SmsHomeAdvertise SmsHomeBrand SmsHomeNewProduct \
          SmsHomeRecommendProduct SmsHomeRecommendSubject CmsSubject)
for E in "${ENTITIES[@]}"; do
  copy "$SRC_MODEL/$E.java"          "$TGT_MODEL/$E.java"
  copy "$SRC_MODEL/${E}Example.java" "$TGT_MODEL/${E}Example.java"
  copy "$SRC_MAPPER/${E}Mapper.java" "$TGT_MAPPER/${E}Mapper.java"
  copy "$SRC_XML/${E}Mapper.xml"     "$TGT_XML/${E}Mapper.xml"
done

# ---- mall-admin: controller + service + impl(9 组)----
ADMIN=(SmsCoupon SmsCouponHistory SmsFlashPromotion CmsSubject SmsHomeAdvertise \
       SmsHomeBrand SmsHomeNewProduct SmsHomeRecommendProduct SmsHomeRecommendSubject)
for A in "${ADMIN[@]}"; do
  copy "$SRC_ADM/controller/${A}Controller.java"   "$TGT_ADM/controller/${A}Controller.java"
  copy "$SRC_ADM/service/${A}Service.java"         "$TGT_ADM/service/${A}Service.java"
  copy "$SRC_ADM/service/impl/${A}ServiceImpl.java" "$TGT_ADM/service/impl/${A}ServiceImpl.java"
done

# ---- DTO ----
copy "$SRC_ADM/dto/SmsCouponParam.java" "$TGT_ADM/dto/SmsCouponParam.java"

# ---- 自定义 Dao + XML(优惠券关联)----
DAOS=(SmsCouponDao SmsCouponProductRelationDao SmsCouponProductCategoryRelationDao)
for D in "${DAOS[@]}"; do
  copy "$SRC_ADM/dao/$D.java"     "$TGT_ADM/dao/$D.java"
  copy "$SRC_DAOXML/$D.xml"       "$TGT_DAOXML/$D.xml"
done

# ------------------------------------------------------------------
# 统一变换所有复制出来的文件
# ------------------------------------------------------------------
for f in "${COPIED[@]}"; do
  # 1) 包名/全限定名
  sed -i '' 's/com\.macro\.mall/com.phil.mall/g' "$f"
  # 2) 去除 springfox import 与注解(仅对 .java 生效;.xml 无这些内容不受影响)
  case "$f" in
    *.java)
      sed -i '' '/^import io\.swagger\.annotations\./d' "$f"
      sed -i '' '/^[[:space:]]*@Api(/d' "$f"
      sed -i '' '/^[[:space:]]*@ApiOperation/d' "$f"
      sed -i '' '/^[[:space:]]*@ApiModel(/d' "$f"
      sed -i '' '/^[[:space:]]*@ApiModelProperty/d' "$f"
      ;;
  esac
done

echo "----------------------------------------------------------------"
echo "复制完成:${#COPIED[@]} 个文件"
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "缺失源文件 ${#MISSING[@]} 个(需人工确认):"
  printf '  %s\n' "${MISSING[@]}"
fi
echo "----------------------------------------------------------------"
echo "下一步: cd $TGT && mvn -pl mall-admin -am -q -DskipTests compile"
