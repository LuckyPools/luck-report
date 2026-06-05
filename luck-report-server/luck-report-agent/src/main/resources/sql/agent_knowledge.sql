-- 智能体知识表（MySQL）
-- 存储智能体知识的全量数据，包括标题、类型、内容等
-- 向量化后的数据存储在 PostgreSQL 的 vector_document 表中

CREATE TABLE IF NOT EXISTS `agent_knowledge` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(255) NOT NULL COMMENT '知识标题',
  `type` VARCHAR(20) NOT NULL COMMENT '知识类型：DOCUMENT-文档，QA-问答对，FAQ-常见问题',
  `question` TEXT DEFAULT NULL COMMENT '问题（FAQ和QA类型时使用）',
  `content` TEXT DEFAULT NULL COMMENT '内容（当type=QA, FAQ时有内容）',
  `enabled` TINYINT DEFAULT 1 COMMENT '是否生效（0:不生效, 1:生效）',
  `embedding_status` VARCHAR(20) DEFAULT 'PENDING' COMMENT '向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败',
  `error_msg` VARCHAR(500) DEFAULT NULL COMMENT '操作失败的错误信息',
  `source_filename` VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
  `file_path` VARCHAR(500) DEFAULT NULL COMMENT '文件存储路径',
  `file_size` BIGINT DEFAULT NULL COMMENT '文件大小（字节）',
  `file_type` VARCHAR(100) DEFAULT NULL COMMENT '文件类型',
  `splitter_type` VARCHAR(20) DEFAULT 'token' COMMENT '分块策略类型：token, recursive, sentence, paragraph, semantic',
  `model_id` BIGINT DEFAULT NULL COMMENT '嵌入模型配置ID，用于指定向量化时使用的嵌入模型',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否已删除（0:未删除, 1:已删除）',
  `is_resource_cleaned` TINYINT DEFAULT 0 COMMENT '物理资源是否已清理（0:未清理, 1:已清理）',
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_enabled` (`enabled`),
  KEY `idx_embedding_status` (`embedding_status`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体知识表';
