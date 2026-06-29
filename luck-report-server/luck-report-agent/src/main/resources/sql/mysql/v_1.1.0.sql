-- =============================================
-- Luck Report Agent 数据库变更脚本 v1.1.0
-- 数据库类型：MySQL
-- 说明：新增 luck_report_file 表，用于数据库存储报表
-- =============================================

-- 报表文件表（数据库存储）
CREATE TABLE IF NOT EXISTS `luck_report_file` (
  `id` VARCHAR(32) NOT NULL COMMENT '主键ID（Snowflake）',
  `title` VARCHAR(255) NOT NULL COMMENT '报表标题',
  `template` MEDIUMTEXT DEFAULT NULL COMMENT '报表模板内容（XML）',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否已删除（0:未删除，1:已删除）',
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_deleted` (`is_deleted`),
  KEY `idx_title` (`title`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报表文件表（数据库存储）';
