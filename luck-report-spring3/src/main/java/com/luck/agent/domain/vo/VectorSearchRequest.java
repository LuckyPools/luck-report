package com.luck.agent.domain.vo;

import java.util.List;
import java.util.Map;

/**
 * 向量检索请求 VO
 * 前端 Agent 工具调用此 VO 对应的接口进行知识检索
 *
 * @author luck
 */
public class VectorSearchRequest {

    /** 查询文本，如 "柱状图怎么用"、"条件样式" */
    private String query;

    /** 知识类型：COMPONENT/TEMPLATE/DATASOURCE/BUSINESS */
    private String vectorType;

    /** 返回条数，默认5 */
    private Integer topK = 5;

    /** 相似度阈值（0~1），默认0.5 */
    private Double threshold = 0.5;

    /** 额外元数据过滤条件，如 {"componentType": "chart"} */
    private Map<String, Object> metadataFilters;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getVectorType() {
        return vectorType;
    }

    public void setVectorType(String vectorType) {
        this.vectorType = vectorType;
    }

    public Integer getTopK() {
        return topK;
    }

    public void setTopK(Integer topK) {
        this.topK = topK;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }

    public Map<String, Object> getMetadataFilters() {
        return metadataFilters;
    }

    public void setMetadataFilters(Map<String, Object> metadataFilters) {
        this.metadataFilters = metadataFilters;
    }
}
