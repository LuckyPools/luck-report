package com.luck.report.infra.modules.vector.domain.entity;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 向量文档
 * 参照 Spring AI 的 Document 类，适配 JDK 8 简化实现
 * 每个文档包含文本内容、向量、元数据三部分
 *
 * 元数据规范：
 * - vectorType: 知识类型（COMPONENT/TEMPLATE/DATASOURCE/BUSINESS），必填
 * - componentType: 组件类型（chart/cell/dataset 等），COMPONENT 类型必填
 * - datasourceId: 数据源ID，DATASOURCE 类型必填
 * - 其他自定义字段按需添加
 *
 * @author luck
 */
public class VectorDocument {

    /** 文档唯一ID */
    private String id;

    /** 文本内容，用于向量化 */
    private String content;

    /** 向量数据，由 EmbeddingService 生成 */
    private float[] vector;

    /** 元数据，用于过滤和检索 */
    private Map<String, Object> metadata;

    /**
     * 构造向量文档（自动生成ID）
     *
     * @param content 文本内容
     * @param metadata 元数据
     */
    public VectorDocument(String content, Map<String, Object> metadata) {
        this.id = UUID.randomUUID().toString();
        this.content = content;
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }

    /**
     * 构造向量文档（指定ID）
     *
     * @param id 文档ID
     * @param content 文本内容
     * @param metadata 元数据
     */
    public VectorDocument(String id, String content, Map<String, Object> metadata) {
        this.id = id;
        this.content = content;
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public float[] getVector() {
        return vector;
    }

    public void setVector(float[] vector) {
        this.vector = vector;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
