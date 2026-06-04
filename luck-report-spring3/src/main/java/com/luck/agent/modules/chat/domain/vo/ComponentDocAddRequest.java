package com.luck.agent.modules.chat.domain.vo;

import java.util.Map;

/**
 * 组件文档添加请求 VO
 * 用于向向量库添加报表组件文档（图表、单元格、样式等）
 * 对应 ReportAgentVectorStore.addComponentDoc() 方法
 *
 * @author luck
 */
public class ComponentDocAddRequest {

    /** 组件名称，如 "柱状图"、"条件样式"、"数据集" */
    private String name;

    /** 组件描述/用法说明，如 "柱状图用于展示分类数据的对比，支持堆叠和横向展示" */
    private String description;

    /** 组件类型，如 "chart"、"cell"、"dataset"、"style" */
    private String componentType;

    /** 额外元数据，如 {"category": "图表", "subTypes": "bar,line,area"}，可为 null */
    private Map<String, Object> extraMetadata;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getComponentType() {
        return componentType;
    }

    public void setComponentType(String componentType) {
        this.componentType = componentType;
    }

    public Map<String, Object> getExtraMetadata() {
        return extraMetadata;
    }

    public void setExtraMetadata(Map<String, Object> extraMetadata) {
        this.extraMetadata = extraMetadata;
    }
}
