package com.luck.agent.domain.vo;

import java.util.Map;

/**
 * 向量文档添加请求 VO
 * 前端或管理端通过此 VO 向向量库添加文档
 *
 * @author luck
 */
public class VectorAddRequest {

    /** 文本内容 */
    private String content;

    /** 知识类型：COMPONENT/TEMPLATE/DATASOURCE/BUSINESS */
    private String vectorType;

    /** 元数据 */
    private Map<String, Object> metadata;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getVectorType() {
        return vectorType;
    }

    public void setVectorType(String vectorType) {
        this.vectorType = vectorType;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
