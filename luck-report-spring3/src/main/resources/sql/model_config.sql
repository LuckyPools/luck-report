-- 模型配置表
-- 用于存储大模型的连接信息和调用参数,支持多种模型提供商
-- 后期会提供管理界面维护

CREATE TABLE IF NOT EXISTS `model_config` (
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

-- 初始化默认配置数据(可选)
-- 默认千问对话模型配置
INSERT INTO `model_config` (
    `provider`, `base_url`, `api_key`, `model_name`, `config_name`, `sort`, `temperature`, 
    `is_active`, `max_tokens`, `model_type`, `completions_path`, 
    `created_time`, `updated_time`, `is_deleted`
) VALUES (
    'alibaba', 
    'https://dashscope.aliyuncs.com/compatible-mode/v1', 
    'sk-391c6103719e4169933ebcd160280b12', 
    'qwen3.5-plus',
    '通义千问',
    0,
    0.7, 
    1, 
    8192, 
    'CHAT', 
    '/chat/completions', 
    NOW(), 
    NOW(), 
    0
) ON DUPLICATE KEY UPDATE `updated_time` = NOW();

-- 默认千问嵌入模型配置
INSERT INTO `model_config` (
    `provider`, `base_url`, `api_key`, `model_name`, `config_name`, `sort`, `temperature`, 
    `is_active`, `max_tokens`, `model_type`, `embeddings_path`, 
    `created_time`, `updated_time`, `is_deleted`
) VALUES (
    'alibaba', 
    'https://dashscope.aliyuncs.com/compatible-mode/v1', 
    'sk-391c6103719e4169933ebcd160280b12', 
    'text-embedding-v3',
    '千问嵌入模型',
    0,
    0.0, 
    1, 
    NULL, 
    'EMBEDDING', 
    '/embeddings', 
    NOW(), 
    NOW(), 
    0
) ON DUPLICATE KEY UPDATE `updated_time` = NOW();