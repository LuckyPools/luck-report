-- 报表 Agent 数据库初始化脚本

-- 会话表
CREATE TABLE IF NOT EXISTS `chat_session` (
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
CREATE TABLE IF NOT EXISTS `chat_message` (
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
    CONSTRAINT `chat_message_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='聊天消息表';
