-- =============================================
-- Luck Report Agent 数据库初始化脚本 v1.0.0
-- 数据库类型：MySQL
-- =============================================

-- 会话表
CREATE TABLE IF NOT EXISTS `luck_chat_session` (
    `id` varchar(36) NOT NULL COMMENT '会话ID（UUID）',
    `title` varchar(255) DEFAULT '新对话' COMMENT '会话标题',
    `status` varchar(50) DEFAULT 'active' COMMENT '状态：active-活跃，archived-归档，deleted-已删除',
    `is_pinned` tinyint DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
    `user_id` bigint DEFAULT NULL COMMENT '用户ID',
    `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_is_pinned` (`is_pinned`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='聊天会话表';

-- 消息表
CREATE TABLE IF NOT EXISTS `luck_chat_message` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    `session_id` varchar(36) NOT NULL COMMENT '会话ID',
    `role` varchar(20) NOT NULL COMMENT '角色：user-用户，assistant-助手，system-系统，tool_result-工具结果',
    `content` text COMMENT '消息内容',
    `message_type` varchar(50) DEFAULT 'text' COMMENT '消息类型：text-文本，tool_call-工具调用，tool_result-工具结果，error-错误',
    `metadata` json DEFAULT NULL COMMENT '元数据（JSON格式，存储tool_calls数组或tool_call_id等）',
    `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_role` (`role`),
    KEY `idx_message_type` (`message_type`),
    KEY `idx_create_time` (`create_time`),
    CONSTRAINT `luck_chat_message_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `luck_chat_session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='聊天消息表';

-- 模型配置表
CREATE TABLE IF NOT EXISTS `luck_model_config` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    `provider` varchar(255) NOT NULL COMMENT '厂商标识(如 alibaba、openai、deepseek),方便前端展示回显',
    `base_url` varchar(255) NOT NULL COMMENT 'API基础地址(如 https://dashscope.aliyuncs.com/compatible-mode/v1)',
    `api_key` varchar(255) NOT NULL COMMENT 'API密钥',
    `model_name` varchar(255) NOT NULL COMMENT '模型名称(如 qwen3.5-plus、text-embedding-v3)',
    `config_name` varchar(50) DEFAULT NULL COMMENT '自定义名称,最多50个字',
    `sort` int(11) DEFAULT '0' COMMENT '排序字段,数字越小越靠前',
    `temperature` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '温度参数,控制生成随机性,0~1',
    `is_active` tinyint(1) DEFAULT '0' COMMENT '是否激活:true-当前使用,false-未使用',
    `max_tokens` int(11) DEFAULT '2000' COMMENT '输出响应最大令牌数',
    `model_type` varchar(20) NOT NULL DEFAULT 'CHAT' COMMENT '模型类型(CHAT/EMBEDDING)',
    `completions_path` varchar(255) DEFAULT NULL COMMENT 'Chat模型专用。附加到Base URL的路径。例如OpenAI的/v1/chat/completions',
    `embeddings_path` varchar(255) DEFAULT NULL COMMENT '嵌入模型专用。附加到Base URL的路径。',
    `created_time` datetime DEFAULT NULL COMMENT '创建时间',
    `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
    `is_deleted` int(11) DEFAULT '0' COMMENT '逻辑删除:0-未删除,1-已删除',
    -- 代理配置字段(默认关闭以确保零侵入性)
    `proxy_enabled` tinyint(1) DEFAULT '0' COMMENT '是否启用代理:0-禁用,1-启用',
    `proxy_host` varchar(255) DEFAULT NULL COMMENT '代理主机地址',
    `proxy_port` int(11) DEFAULT NULL COMMENT '代理端口',
    `proxy_username` varchar(255) DEFAULT NULL COMMENT '代理用户名(可选)',
    `proxy_password` varchar(255) DEFAULT NULL COMMENT '代理密码(可选)',
    PRIMARY KEY (`id`),
    INDEX `idx_model_type` (`model_type`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_provider` (`provider`),
    INDEX `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='大模型配置表';

-- 数据源配置表
CREATE TABLE IF NOT EXISTS `luck_datasource` (
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
    `model_id`              BIGINT DEFAULT NULL COMMENT '嵌入模型配置ID，用于指定向量化时使用的嵌入模型',
    `initialized_tables`    TEXT COMMENT '已初始化的表名列表（JSON格式存储，如["table1","table2"]）',
    `creator_id`      BIGINT COMMENT '创建人ID',
    `create_time`     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_status` (`status`),
    INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源配置表';

-- 逻辑外键配置表
CREATE TABLE IF NOT EXISTS `luck_logical_relation` (
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
    CONSTRAINT `fk_luck_logical_relation_datasource` FOREIGN KEY (`datasource_id`) REFERENCES `luck_datasource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='逻辑外键配置表';

-- 业务知识表
CREATE TABLE IF NOT EXISTS `luck_business_knowledge` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `business_term` VARCHAR(255) NOT NULL COMMENT '业务名词',
  `description` TEXT NOT NULL COMMENT '业务知识描述',
  `synonyms` VARCHAR(500) DEFAULT NULL COMMENT '同义词，多个用逗号分隔',
  `enabled` TINYINT DEFAULT 1 COMMENT '是否生效（0:不生效, 1:生效）',
  `model_id` BIGINT DEFAULT NULL COMMENT '关联的嵌入模型ID',
  `embedding_status` VARCHAR(20) DEFAULT 'PENDING' COMMENT '向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败',
  `error_msg` VARCHAR(500) DEFAULT NULL COMMENT '操作失败的错误信息',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否已删除（0:未删除, 1:已删除）',
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_embedding_status` (`embedding_status`),
  KEY `idx_enabled` (`enabled`),
  KEY `idx_is_deleted` (`is_deleted`),
  KEY `idx_model_id` (`model_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务知识表';

-- 智能体知识表
CREATE TABLE IF NOT EXISTS `luck_agent_knowledge` (
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
