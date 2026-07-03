-- =============================================
-- 向量文档表（PostgreSQL + pgvector）
-- 前置条件：数据库中已安装 pgvector 插件
-- 注意：扩展和表都安装在 luck_report_vector schema 下
--       使用前需先执行 CREATE SCHEMA IF NOT EXISTS luck_report_vector;
-- =============================================

-- 创建 schema
CREATE SCHEMA IF NOT EXISTS luck_report_vector;

-- 安装 vector 扩展到 luck_report_vector schema
CREATE EXTENSION IF NOT EXISTS vector SCHEMA luck_report_vector;

-- 验证扩展安装
SELECT extname, extnamespace::regnamespace AS schema, extversion FROM pg_extension WHERE extname = 'vector';

CREATE TABLE IF NOT EXISTS luck_report_vector.luck_vector_document (
    id          VARCHAR(64)    NOT NULL,
    vector      luck_report_vector.vector(1024) NOT NULL,
    metadata    JSONB          NOT NULL DEFAULT '{}',
    vector_type VARCHAR(32)    NOT NULL DEFAULT 'UNKNOWN',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
    );

-- 给表和字段加注释（PostgreSQL 专用写法）
COMMENT ON TABLE  luck_report_vector.luck_vector_document IS '向量文档表（不含content，全量数据存储在MySQL）';
COMMENT ON COLUMN luck_report_vector.luck_vector_document.id IS '文档唯一ID';
COMMENT ON COLUMN luck_report_vector.luck_vector_document.vector IS '向量数据，text-embedding-v3 输出 1024 维';
COMMENT ON COLUMN luck_report_vector.luck_vector_document.metadata IS '元数据，JSON格式，支持 jsonb 操作符过滤';
COMMENT ON COLUMN luck_report_vector.luck_vector_document.vector_type IS '知识类型: COMPONENT/TEMPLATE/DATASOURCE/BUSINESS';
COMMENT ON COLUMN luck_report_vector.luck_vector_document.created_at IS '创建时间';

-- 普通索引
CREATE INDEX IF NOT EXISTS idx_luck_vector_document_type
    ON luck_report_vector.luck_vector_document (vector_type);

-- 向量相似度索引（必须建！否则搜索巨慢）
CREATE INDEX IF NOT EXISTS idx_luck_vector_document_vector
    ON luck_report_vector.luck_vector_document
    USING hnsw (vector vector_cosine_ops);