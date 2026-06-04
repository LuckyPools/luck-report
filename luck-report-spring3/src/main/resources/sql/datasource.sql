-- 数据源管理功能数据库初始化脚本

-- 数据源配置表
CREATE TABLE IF NOT EXISTS `datasource` (
    `id`              INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    `name`            VARCHAR(100) NOT NULL COMMENT '数据源名称',
    `type`            VARCHAR(50) NOT NULL COMMENT '数据源类型：mysql/postgresql/oracle/dameng/sqlserver/hive',
    `host`            VARCHAR(255) NOT NULL COMMENT '主机地址',
    `port`            INT NOT NULL COMMENT '端口号',
    `database_name`   VARCHAR(100) COMMENT '数据库名',
    `username`        VARCHAR(100) COMMENT '用户名',
    `password`        VARCHAR(255) COMMENT '密码',
    `connection_url`  VARCHAR(500) COMMENT '完整连接URL',
    `status`          VARCHAR(20) DEFAULT 'active' COMMENT '状态：active/inactive',
    `test_status`     VARCHAR(20) DEFAULT 'unknown' COMMENT '连接测试状态：success/failed/unknown',
    `description`     TEXT COMMENT '描述',
    `model_id`        BIGINT DEFAULT NULL COMMENT '嵌入模型配置ID，用于指定向量化时使用的嵌入模型',
    `creator_id`      BIGINT COMMENT '创建人ID',
    `create_time`     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_status` (`status`),
    INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源配置表';

-- 逻辑外键配置表
CREATE TABLE IF NOT EXISTS `logical_relation` (
    `id`                 INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    `datasource_id`      INT NOT NULL COMMENT '数据源ID',
    `source_table_name`  VARCHAR(100) NOT NULL COMMENT '主表名',
    `source_column_name` VARCHAR(100) NOT NULL COMMENT '主表字段名',
    `target_table_name`  VARCHAR(100) NOT NULL COMMENT '关联表名',
    `target_column_name` VARCHAR(100) NOT NULL COMMENT '关联表字段名',
    `relation_type`      VARCHAR(20) COMMENT '关系类型：1:1/1:N/N:1',
    `description`        TEXT COMMENT '业务描述',
    `is_deleted`         TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    `created_time`       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time`       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_datasource_id` (`datasource_id`),
    INDEX `idx_source_table` (`source_table_name`),
    INDEX `idx_target_table` (`target_table_name`),
    CONSTRAINT `fk_logical_relation_datasource` FOREIGN KEY (`datasource_id`) REFERENCES `datasource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='逻辑外键配置表';
