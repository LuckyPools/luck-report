package com.luck.agent.modules.vector.domain.dto;

import com.luck.agent.modules.vector.domain.entity.VectorDocument;

/**
 * 向量检索结果
 * 包含匹配的文档和相似度得分
 *
 * @author luck
 */
public class VectorStoreSearchResult {

    /** 匹配的文档 */
    private VectorDocument document;

    /** 相似度得分（0~1，越大越相似） */
    private double score;

    /**
     * 构造向量检索结果
     *
     * @param document 匹配的文档
     * @param score    相似度得分
     */
    public VectorStoreSearchResult(VectorDocument document, double score) {
        this.document = document;
        this.score = score;
    }

    public VectorDocument getDocument() {
        return document;
    }

    public void setDocument(VectorDocument document) {
        this.document = document;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }
}
