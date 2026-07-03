package com.luck.report.infra.modules.vector.domain.vo;

import java.util.Map;

/**
 * 向量检索结果 VO
 * 返回给前端的检索结果，包含文档内容和相似度得分
 *
 * @author luck
 */
public class VectorSearchResult {

    /** 文档ID */
    private String id;

    /** 文本内容 */
    private String content;

    /** 相似度得分（0~1，越大越相似） */
    private double score;

    /** 元数据 */
    private Map<String, Object> metadata;

    public VectorSearchResult() {
    }

    public VectorSearchResult(String id, String content, double score, Map<String, Object> metadata) {
        this.id = id;
        this.content = content;
        this.score = score;
        this.metadata = metadata;
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

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
