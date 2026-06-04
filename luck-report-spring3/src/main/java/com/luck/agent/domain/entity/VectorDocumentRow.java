package com.luck.agent.domain.entity;

import lombok.Data;

/**
 * 向量文档数据库行映射实体
 * 对应 PostgreSQL 的 vector_document 表，用于 MyBatis Mapper 的查询结果映射
 * 与 VectorDocument 不同，此实体包含数据库特有字段（vectorType、similarity）
 * 注意：已去掉content字段，全量内容存储在MySQL中
 *
 * @author luck
 */
@Data
public class VectorDocumentRow {

    /** 文档唯一ID */
    private String id;

    /** 向量字符串（pgvector 格式 "[0.1,0.2,0.3]"） */
    private String vector;

    /** 元数据 JSON 字符串 */
    private String metadata;

    /** 知识类型 */
    private String vectorType;

    /** 相似度得分（仅检索时有值） */
    private Double similarity;
}
