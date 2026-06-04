-- 业务知识表（MySQL）
-- 存储业务知识的全量数据，包括业务名词、描述、同义词等
-- 向量化后的数据存储在 PostgreSQL 的 vector_document 表中

CREATE TABLE IF NOT EXISTS `business_knowledge` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `business_term` VARCHAR(255) NOT NULL COMMENT '业务名词',
  `description` TEXT NOT NULL COMMENT '业务知识描述',
  `synonyms` VARCHAR(500) DEFAULT NULL COMMENT '同义词，多个用逗号分隔',
  `is_recall` TINYINT DEFAULT 1 COMMENT '是否召回（0:不召回, 1:召回）',
  `model_id` BIGINT DEFAULT NULL COMMENT '关联的嵌入模型ID',
  `embedding_status` VARCHAR(20) DEFAULT 'PENDING' COMMENT '向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败',
  `error_msg` VARCHAR(500) DEFAULT NULL COMMENT '操作失败的错误信息',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否已删除（0:未删除, 1:已删除）',
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_embedding_status` (`embedding_status`),
  KEY `idx_is_recall` (`is_recall`),
  KEY `idx_is_deleted` (`is_deleted`),
  KEY `idx_model_id` (`model_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务知识表';