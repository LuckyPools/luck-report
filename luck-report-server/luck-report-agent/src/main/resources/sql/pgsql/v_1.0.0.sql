-- =============================================
-- Luck Report Agent 数据库初始化脚本 v1.0.0
-- 数据库类型：PostgreSQL
-- =============================================

-- 会话表
CREATE TABLE IF NOT EXISTS luck_chat_session (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) DEFAULT '新对话',
    status VARCHAR(50) DEFAULT 'active',
    is_pinned SMALLINT DEFAULT 0,
    user_id BIGINT DEFAULT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自动更新 luck_chat_session.update_time 的触发器
CREATE OR REPLACE FUNCTION update_luck_chat_session_update_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.update_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_luck_chat_session_update_time ON luck_chat_session;
CREATE TRIGGER trg_luck_chat_session_update_time
  BEFORE UPDATE ON luck_chat_session
  FOR EACH ROW EXECUTE FUNCTION update_luck_chat_session_update_time();

CREATE INDEX IF NOT EXISTS idx_cs_user_id ON luck_chat_session (user_id);
CREATE INDEX IF NOT EXISTS idx_cs_status ON luck_chat_session (status);
CREATE INDEX IF NOT EXISTS idx_cs_is_pinned ON luck_chat_session (is_pinned);
CREATE INDEX IF NOT EXISTS idx_cs_create_time ON luck_chat_session (create_time);

COMMENT ON TABLE luck_chat_session IS '聊天会话表';
COMMENT ON COLUMN luck_chat_session.id IS '会话ID（UUID）';
COMMENT ON COLUMN luck_chat_session.title IS '会话标题';
COMMENT ON COLUMN luck_chat_session.status IS '状态：active-活跃，archived-归档，deleted-已删除';
COMMENT ON COLUMN luck_chat_session.is_pinned IS '是否置顶：0-否，1-是';
COMMENT ON COLUMN luck_chat_session.user_id IS '用户ID';
COMMENT ON COLUMN luck_chat_session.create_time IS '创建时间';
COMMENT ON COLUMN luck_chat_session.update_time IS '更新时间';

-- 消息表
CREATE TABLE IF NOT EXISTS luck_chat_message (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB DEFAULT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cm_session_id ON luck_chat_message (session_id);
CREATE INDEX IF NOT EXISTS idx_cm_role ON luck_chat_message (role);
CREATE INDEX IF NOT EXISTS idx_cm_message_type ON luck_chat_message (message_type);
CREATE INDEX IF NOT EXISTS idx_cm_create_time ON luck_chat_message (create_time);

ALTER TABLE luck_chat_message
  ADD CONSTRAINT fk_luck_chat_message_session
  FOREIGN KEY (session_id) REFERENCES luck_chat_session (id) ON DELETE CASCADE;

COMMENT ON TABLE luck_chat_message IS '聊天消息表';
COMMENT ON COLUMN luck_chat_message.id IS '消息ID';
COMMENT ON COLUMN luck_chat_message.session_id IS '会话ID';
COMMENT ON COLUMN luck_chat_message.role IS '角色：user-用户，assistant-助手，system-系统，tool_result-工具结果';
COMMENT ON COLUMN luck_chat_message.content IS '消息内容';
COMMENT ON COLUMN luck_chat_message.message_type IS '消息类型：text-文本，tool_call-工具调用，tool_result-工具结果，error-错误';
COMMENT ON COLUMN luck_chat_message.metadata IS '元数据（JSONB格式，存储tool_calls数组或tool_call_id等）';
COMMENT ON COLUMN luck_chat_message.create_time IS '创建时间';

-- 模型配置表
CREATE TABLE IF NOT EXISTS luck_model_config (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(255) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    config_name VARCHAR(50) DEFAULT NULL,
    sort INT DEFAULT 0,
    temperature DECIMAL(10,2) DEFAULT 0.00,
    is_active SMALLINT DEFAULT 0,
    max_tokens INT DEFAULT 2000,
    model_type VARCHAR(20) NOT NULL DEFAULT 'CHAT',
    completions_path VARCHAR(255) DEFAULT NULL,
    embeddings_path VARCHAR(255) DEFAULT NULL,
    created_time TIMESTAMP DEFAULT NULL,
    updated_time TIMESTAMP DEFAULT NULL,
    is_deleted INT DEFAULT 0,
    proxy_enabled SMALLINT DEFAULT 0,
    proxy_host VARCHAR(255) DEFAULT NULL,
    proxy_port INT DEFAULT NULL,
    proxy_username VARCHAR(255) DEFAULT NULL,
    proxy_password VARCHAR(255) DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_mc_model_type ON luck_model_config (model_type);
CREATE INDEX IF NOT EXISTS idx_mc_is_active ON luck_model_config (is_active);
CREATE INDEX IF NOT EXISTS idx_mc_provider ON luck_model_config (provider);
CREATE INDEX IF NOT EXISTS idx_mc_sort ON luck_model_config (sort);

COMMENT ON TABLE luck_model_config IS '大模型配置表';
COMMENT ON COLUMN luck_model_config.id IS '配置ID';
COMMENT ON COLUMN luck_model_config.provider IS '厂商标识(如 alibaba、openai、deepseek),方便前端展示回显';
COMMENT ON COLUMN luck_model_config.base_url IS 'API基础地址(如 https://dashscope.aliyuncs.com/compatible-mode/v1)';
COMMENT ON COLUMN luck_model_config.api_key IS 'API密钥';
COMMENT ON COLUMN luck_model_config.model_name IS '模型名称(如 qwen3.5-plus、text-embedding-v3)';
COMMENT ON COLUMN luck_model_config.config_name IS '自定义名称,最多50个字';
COMMENT ON COLUMN luck_model_config.sort IS '排序字段,数字越小越靠前';
COMMENT ON COLUMN luck_model_config.temperature IS '温度参数,控制生成随机性,0~1';
COMMENT ON COLUMN luck_model_config.is_active IS '是否激活:1-当前使用,0-未使用';
COMMENT ON COLUMN luck_model_config.max_tokens IS '输出响应最大令牌数';
COMMENT ON COLUMN luck_model_config.model_type IS '模型类型(CHAT/EMBEDDING)';
COMMENT ON COLUMN luck_model_config.completions_path IS 'Chat模型专用。附加到Base URL的路径。例如OpenAI的/v1/chat/completions';
COMMENT ON COLUMN luck_model_config.embeddings_path IS '嵌入模型专用。附加到Base URL的路径。';
COMMENT ON COLUMN luck_model_config.created_time IS '创建时间';
COMMENT ON COLUMN luck_model_config.updated_time IS '更新时间';
COMMENT ON COLUMN luck_model_config.is_deleted IS '逻辑删除:0-未删除,1-已删除';
COMMENT ON COLUMN luck_model_config.proxy_enabled IS '是否启用代理:0-禁用,1-启用';
COMMENT ON COLUMN luck_model_config.proxy_host IS '代理主机地址';
COMMENT ON COLUMN luck_model_config.proxy_port IS '代理端口';
COMMENT ON COLUMN luck_model_config.proxy_username IS '代理用户名(可选)';
COMMENT ON COLUMN luck_model_config.proxy_password IS '代理密码(可选)';

-- 数据源配置表
CREATE TABLE IF NOT EXISTS luck_datasource (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    database_name VARCHAR(100),
    username VARCHAR(100),
    password VARCHAR(255),
    connection_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    test_status VARCHAR(20) DEFAULT 'unknown',
    description TEXT,
    model_id VARCHAR(32) DEFAULT NULL,
    initialized_tables TEXT,
    creator_id VARCHAR(32),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自动更新 luck_datasource.update_time 的触发器
CREATE OR REPLACE FUNCTION update_luck_datasource_update_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.update_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_luck_datasource_update_time ON luck_datasource;
CREATE TRIGGER trg_luck_datasource_update_time
  BEFORE UPDATE ON luck_datasource
  FOR EACH ROW EXECUTE FUNCTION update_luck_datasource_update_time();

CREATE INDEX IF NOT EXISTS idx_ds_status ON luck_datasource (status);
CREATE INDEX IF NOT EXISTS idx_ds_type ON luck_datasource (type);

COMMENT ON TABLE luck_datasource IS '数据源配置表';
COMMENT ON COLUMN luck_datasource.id IS '主键ID';
COMMENT ON COLUMN luck_datasource.name IS '数据源名称';
COMMENT ON COLUMN luck_datasource.type IS '数据源类型：mysql/postgresql/oracle/dameng/sqlserver/hive';
COMMENT ON COLUMN luck_datasource.host IS '主机地址';
COMMENT ON COLUMN luck_datasource.port IS '端口号';
COMMENT ON COLUMN luck_datasource.database_name IS '数据库名';
COMMENT ON COLUMN luck_datasource.username IS '用户名';
COMMENT ON COLUMN luck_datasource.password IS '密码';
COMMENT ON COLUMN luck_datasource.connection_url IS '完整连接URL';
COMMENT ON COLUMN luck_datasource.status IS '状态：active/inactive';
COMMENT ON COLUMN luck_datasource.test_status IS '连接测试状态：success/failed/unknown';
COMMENT ON COLUMN luck_datasource.description IS '描述';
COMMENT ON COLUMN luck_datasource.model_id IS '嵌入模型配置ID，用于指定向量化时使用的嵌入模型';
COMMENT ON COLUMN luck_datasource.initialized_tables IS '已初始化的表名列表（JSON格式存储，如["table1","table2"]）';
COMMENT ON COLUMN luck_datasource.creator_id IS '创建人ID';
COMMENT ON COLUMN luck_datasource.create_time IS '创建时间';
COMMENT ON COLUMN luck_datasource.update_time IS '更新时间';

-- 逻辑外键配置表
CREATE TABLE IF NOT EXISTS luck_logical_relation (
    id SERIAL PRIMARY KEY,
    datasource_id INT NOT NULL,
    source_table_name VARCHAR(100) NOT NULL,
    source_column_name VARCHAR(100) NOT NULL,
    target_table_name VARCHAR(100) NOT NULL,
    target_column_name VARCHAR(100) NOT NULL,
    relation_type VARCHAR(20),
    description TEXT,
    is_deleted SMALLINT DEFAULT 0,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自动更新 luck_logical_relation.updated_time 的触发器
CREATE OR REPLACE FUNCTION update_luck_logical_relation_updated_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_luck_logical_relation_updated_time ON luck_logical_relation;
CREATE TRIGGER trg_luck_logical_relation_updated_time
  BEFORE UPDATE ON luck_logical_relation
  FOR EACH ROW EXECUTE FUNCTION update_luck_logical_relation_updated_time();

CREATE INDEX IF NOT EXISTS idx_lr_datasource_id ON luck_logical_relation (datasource_id);
CREATE INDEX IF NOT EXISTS idx_lr_source_table ON luck_logical_relation (source_table_name);
CREATE INDEX IF NOT EXISTS idx_lr_target_table ON luck_logical_relation (target_table_name);

ALTER TABLE luck_logical_relation
  ADD CONSTRAINT fk_luck_logical_relation_datasource
  FOREIGN KEY (datasource_id) REFERENCES luck_datasource (id);

COMMENT ON TABLE luck_logical_relation IS '逻辑外键配置表';
COMMENT ON COLUMN luck_logical_relation.id IS '主键ID';
COMMENT ON COLUMN luck_logical_relation.datasource_id IS '数据源ID';
COMMENT ON COLUMN luck_logical_relation.source_table_name IS '主表名';
COMMENT ON COLUMN luck_logical_relation.source_column_name IS '主表字段名';
COMMENT ON COLUMN luck_logical_relation.target_table_name IS '关联表名';
COMMENT ON COLUMN luck_logical_relation.target_column_name IS '关联表字段名';
COMMENT ON COLUMN luck_logical_relation.relation_type IS '关系类型：1:1/1:N/N:1';
COMMENT ON COLUMN luck_logical_relation.description IS '业务描述';
COMMENT ON COLUMN luck_logical_relation.is_deleted IS '逻辑删除：0-未删除，1-已删除';
COMMENT ON COLUMN luck_logical_relation.created_time IS '创建时间';
COMMENT ON COLUMN luck_logical_relation.updated_time IS '更新时间';

-- 业务知识表
CREATE TABLE IF NOT EXISTS luck_business_knowledge (
  id BIGSERIAL PRIMARY KEY,
  business_term VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  synonyms VARCHAR(500) DEFAULT NULL,
  enabled SMALLINT DEFAULT 1,
  model_id BIGINT DEFAULT NULL,
  embedding_status VARCHAR(20) DEFAULT 'PENDING',
  error_msg VARCHAR(500) DEFAULT NULL,
  is_deleted SMALLINT DEFAULT 0,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自动更新 luck_business_knowledge.updated_time 的触发器
CREATE OR REPLACE FUNCTION update_luck_business_knowledge_updated_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_luck_business_knowledge_updated_time ON luck_business_knowledge;
CREATE TRIGGER trg_luck_business_knowledge_updated_time
  BEFORE UPDATE ON luck_business_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_luck_business_knowledge_updated_time();

CREATE INDEX IF NOT EXISTS idx_bk_embedding_status ON luck_business_knowledge (embedding_status);
CREATE INDEX IF NOT EXISTS idx_bk_enabled ON luck_business_knowledge (enabled);
CREATE INDEX IF NOT EXISTS idx_bk_is_deleted ON luck_business_knowledge (is_deleted);
CREATE INDEX IF NOT EXISTS idx_bk_model_id ON luck_business_knowledge (model_id);

COMMENT ON TABLE luck_business_knowledge IS '业务知识表';
COMMENT ON COLUMN luck_business_knowledge.id IS '主键ID';
COMMENT ON COLUMN luck_business_knowledge.business_term IS '业务名词';
COMMENT ON COLUMN luck_business_knowledge.description IS '业务知识描述';
COMMENT ON COLUMN luck_business_knowledge.synonyms IS '同义词，多个用逗号分隔';
COMMENT ON COLUMN luck_business_knowledge.enabled IS '是否生效（0:不生效, 1:生效）';
COMMENT ON COLUMN luck_business_knowledge.model_id IS '关联的嵌入模型ID';
COMMENT ON COLUMN luck_business_knowledge.embedding_status IS '向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败';
COMMENT ON COLUMN luck_business_knowledge.error_msg IS '操作失败的错误信息';
COMMENT ON COLUMN luck_business_knowledge.is_deleted IS '是否已删除（0:未删除, 1:已删除）';
COMMENT ON COLUMN luck_business_knowledge.created_time IS '创建时间';
COMMENT ON COLUMN luck_business_knowledge.updated_time IS '更新时间';

-- 智能体知识表
CREATE TABLE IF NOT EXISTS luck_agent_knowledge (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  question TEXT DEFAULT NULL,
  content TEXT DEFAULT NULL,
  enabled SMALLINT DEFAULT 1,
  embedding_status VARCHAR(20) DEFAULT 'PENDING',
  error_msg VARCHAR(500) DEFAULT NULL,
  source_filename VARCHAR(255) DEFAULT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  file_size BIGINT DEFAULT NULL,
  file_type VARCHAR(100) DEFAULT NULL,
  splitter_type VARCHAR(20) DEFAULT 'token',
  model_id VARCHAR(32) DEFAULT NULL,
  is_deleted SMALLINT DEFAULT 0,
  is_resource_cleaned SMALLINT DEFAULT 0,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自动更新 luck_agent_knowledge.updated_time 的触发器
CREATE OR REPLACE FUNCTION update_luck_agent_knowledge_updated_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_luck_agent_knowledge_updated_time ON luck_agent_knowledge;
CREATE TRIGGER trg_luck_agent_knowledge_updated_time
  BEFORE UPDATE ON luck_agent_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_luck_agent_knowledge_updated_time();

CREATE INDEX IF NOT EXISTS idx_ak_type ON luck_agent_knowledge (type);
CREATE INDEX IF NOT EXISTS idx_ak_enabled ON luck_agent_knowledge (enabled);
CREATE INDEX IF NOT EXISTS idx_ak_embedding_status ON luck_agent_knowledge (embedding_status);
CREATE INDEX IF NOT EXISTS idx_ak_is_deleted ON luck_agent_knowledge (is_deleted);

COMMENT ON TABLE luck_agent_knowledge IS '智能体知识表';
COMMENT ON COLUMN luck_agent_knowledge.id IS '主键ID';
COMMENT ON COLUMN luck_agent_knowledge.title IS '知识标题';
COMMENT ON COLUMN luck_agent_knowledge.type IS '知识类型：DOCUMENT-文档，QA-问答对，FAQ-常见问题';
COMMENT ON COLUMN luck_agent_knowledge.question IS '问题（FAQ和QA类型时使用）';
COMMENT ON COLUMN luck_agent_knowledge.content IS '内容（当type=QA, FAQ时有内容）';
COMMENT ON COLUMN luck_agent_knowledge.enabled IS '是否生效（0:不生效, 1:生效）';
COMMENT ON COLUMN luck_agent_knowledge.embedding_status IS '向量化状态：PENDING待处理，PROCESSING处理中，COMPLETED已完成，FAILED失败';
COMMENT ON COLUMN luck_agent_knowledge.error_msg IS '操作失败的错误信息';
COMMENT ON COLUMN luck_agent_knowledge.source_filename IS '原始文件名';
COMMENT ON COLUMN luck_agent_knowledge.file_path IS '文件存储路径';
COMMENT ON COLUMN luck_agent_knowledge.file_size IS '文件大小（字节）';
COMMENT ON COLUMN luck_agent_knowledge.file_type IS '文件类型';
COMMENT ON COLUMN luck_agent_knowledge.splitter_type IS '分块策略类型：token, recursive, sentence, paragraph, semantic';
COMMENT ON COLUMN luck_agent_knowledge.model_id IS '嵌入模型配置ID，用于指定向量化时使用的嵌入模型';
COMMENT ON COLUMN luck_agent_knowledge.is_deleted IS '是否已删除（0:未删除, 1:已删除）';
COMMENT ON COLUMN luck_agent_knowledge.is_resource_cleaned IS '物理资源是否已清理（0:未清理, 1:已清理）';
COMMENT ON COLUMN luck_agent_knowledge.created_time IS '创建时间';
COMMENT ON COLUMN luck_agent_knowledge.updated_time IS '更新时间';
