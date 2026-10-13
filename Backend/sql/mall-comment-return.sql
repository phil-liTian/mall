-- ============================================================
-- 商品评价 / 订单售后（C 端）所需的表结构增量变更
-- 执行顺序：在 mall-admin.sql（建 pms_comment）与 mall-order.sql（建 oms_order_return_apply）之后执行
-- 涉及表：pms_comment / oms_order_return_apply
--
-- ponytail: 本仓第一个增量脚本。此前所有 sql 都是 DROP + CREATE 的全量重建式，
--          但这两张表在 mall-admin.sql / mall-order.sql 里已有建表语句和演示数据，
--          重建会丢数据，故改用 ALTER。
-- ponytail: mall-admin.sql 与 mall-order.sql 里的 CREATE TABLE 已同步加入这些列，
--          新环境全量执行那两个脚本即可，不需要再跑本文件；本文件只给已存在的库做补丁。
-- ponytail: 全部变更用 information_schema 做了存在性判断，可重复执行。
--          MySQL 的 ADD COLUMN 不支持 IF NOT EXISTS（那是 MariaDB 的扩展），只能这么写。
--
-- 加列的原因：
--   pms_comment 原表只有 product_id + member_nick_name，既认不出是谁评的，
--     也认不出评的是哪一次购买，无法判断「该订单项是否已评价」。
--   oms_order_return_apply 原表只有 order_id + product_id + member_username，
--     按用户名过滤售后列表不安全（用户名可变），按 (order_id, product_id) 判重
--     会让同商品不同 SKU 被误判为重复申请。
-- ============================================================
SET NAMES utf8mb4;

USE `mall`;

-- ---------------------------- pms_comment ----------------------------
-- 新增 member_id / order_id / order_item_id
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'pms_comment' AND COLUMN_NAME = 'member_id');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `pms_comment`
     ADD COLUMN `member_id` bigint(20) NULL DEFAULT NULL COMMENT ''评价会员id'' AFTER `product_id`,
     ADD COLUMN `order_id` bigint(20) NULL DEFAULT NULL COMMENT ''来源订单id'' AFTER `member_id`,
     ADD COLUMN `order_item_id` bigint(20) NULL DEFAULT NULL COMMENT ''来源订单项id，一个订单项只能评价一次'' AFTER `order_id`',
  'SELECT ''pms_comment: columns already exist, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 唯一键：同一订单项只能评价一次。
-- 历史演示数据的 order_item_id 全为 NULL，MySQL 唯一索引允许多行 NULL，不会冲突。
-- 这是并发双击的最后兜底——服务端的 count 校验防不住并发。
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'pms_comment' AND INDEX_NAME = 'uk_order_item');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `pms_comment` ADD UNIQUE INDEX `uk_order_item` (`order_item_id`)',
  'SELECT ''pms_comment: uk_order_item already exists, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 商详页评价列表与星级统计的主查询条件
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'pms_comment' AND INDEX_NAME = 'idx_product_show');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `pms_comment` ADD INDEX `idx_product_show` (`product_id`, `show_status`)',
  'SELECT ''pms_comment: idx_product_show already exists, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 「我的评价」列表
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'pms_comment' AND INDEX_NAME = 'idx_member');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `pms_comment` ADD INDEX `idx_member` (`member_id`)',
  'SELECT ''pms_comment: idx_member already exists, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------- oms_order_return_apply ----------------------------
-- 新增 order_item_id / member_id
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'oms_order_return_apply' AND COLUMN_NAME = 'member_id');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `oms_order_return_apply`
     ADD COLUMN `member_id` bigint(20) NULL DEFAULT NULL COMMENT ''申请会员id'' AFTER `member_username`,
     ADD COLUMN `order_item_id` bigint(20) NULL DEFAULT NULL COMMENT ''订单项id，售后精确到订单项而非商品'' AFTER `product_id`',
  'SELECT ''oms_order_return_apply: columns already exist, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 「我的售后」列表按会员过滤
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'oms_order_return_apply' AND INDEX_NAME = 'idx_member');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `oms_order_return_apply` ADD INDEX `idx_member` (`member_id`)',
  'SELECT ''oms_order_return_apply: idx_member already exists, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 判重用。故意不设唯一键：被拒绝（status=3）后允许对同一订单项重新申请，
-- 「是否存在进行中的申请」由 service 层按 status 判断。
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = 'mall' AND TABLE_NAME = 'oms_order_return_apply' AND INDEX_NAME = 'idx_order_item');
SET @sql := IF(@exists = 0,
  'ALTER TABLE `oms_order_return_apply` ADD INDEX `idx_order_item` (`order_item_id`)',
  'SELECT ''oms_order_return_apply: idx_order_item already exists, skipped''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
