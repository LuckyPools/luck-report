package com.luck.report.web.domain.vo.request;

import java.util.Map;

public  class DatasetRef {

    /** 数据源名 */
    private String datasourceName;

    /** 数据集名 */
    private String datasetName;

    /** 标签字段：渲染为选项文字 */
    private String labelField;

    /** 值字段：提交到查询参数 */
    private String valueField;

    /** 级联参数（数据集参数名 -> 当前值；多选数组值由前端拼接为字符串），可为空 */
    private Map<String, Object> parameters;

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

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }
}
