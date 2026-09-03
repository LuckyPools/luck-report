package com.luck.report.core.definition.searchform;

import java.io.Serializable;
import java.util.List;

/**
 * 数据集选项绑定配置（查询组件选项来源为数据集时使用）
 *
 * @author luckyPools
 * @since 2026年08月31日
 */
public class DatasetOption implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 数据源名（报表内唯一） */
    private String datasourceName;
    /** 数据集名（数据源内唯一） */
    private String datasetName;
    /** 标签字段：渲染为选项文字 */
    private String labelField;
    /** 值字段：提交到查询参数 */
    private String valueField;
    /** 级联参数绑定（可选）：把其它查询字段的当前值作为数据集查询参数 */
    private List<DatasetParam> datasetParams;

    /**
     * 默认无参构造器
     */
    public DatasetOption() {}

    public String getDatasourceName() {
        return datasourceName;
    }

    public void setDatasourceName(String datasourceName) {
        this.datasourceName = datasourceName;
    }

    public String getDatasetName() {
        return datasetName;
    }

    public void setDatasetName(String datasetName) {
        this.datasetName = datasetName;
    }

    public String getLabelField() {
        return labelField;
    }

    public void setLabelField(String labelField) {
        this.labelField = labelField;
    }

    public String getValueField() {
        return valueField;
    }

    public void setValueField(String valueField) {
        this.valueField = valueField;
    }

    public List<DatasetParam> getDatasetParams() {
        return datasetParams;
    }

    public void setDatasetParams(List<DatasetParam> datasetParams) {
        this.datasetParams = datasetParams;
    }

}
