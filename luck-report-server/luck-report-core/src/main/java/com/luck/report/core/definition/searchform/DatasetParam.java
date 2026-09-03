package com.luck.report.core.definition.searchform;

import java.io.Serializable;

/**
 * 数据集级联参数：对应 XML 中 <datasetParam> 标签，把父查询字段的当前值作为数据集查询参数
 *
 * @author luckyPools
 * @since 2026年08月31日
 */
public class DatasetParam implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 数据集查询参数名（SQL 数据集 parameter 的 name / Bean 方法参数 key） */
    private String paramKey;
    /** 父查询字段的 vModel */
    private String parentField;

    /**
     * 默认无参构造器
     */
    public DatasetParam() {}

    public String getParamKey() {
        return paramKey;
    }

    public void setParamKey(String paramKey) {
        this.paramKey = paramKey;
    }

    public String getParentField() {
        return parentField;
    }

    public void setParentField(String parentField) {
        this.parentField = parentField;
    }
}
