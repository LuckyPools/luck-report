package com.luck.report.core.definition.datasource;

import com.luck.report.core.build.Dataset;
import com.luck.report.core.definition.dataset.DatasetDefinition;
import com.luck.report.core.definition.dataset.JsonDatasetDefinition;
import com.luck.report.core.utils.JsonUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author jack
 * @version 1.0
 * @description: 静态数据源定义类
 * @date 2026-08-07 10:25
 */
public class StaticDatasourceDefinition implements DatasourceDefinition {

    private String name;

    private String remark;

    private List<DatasetDefinition> datasets;

    @Override
    public String getName() {
        return name;
    }

    @Override
    public List<DatasetDefinition> getDatasets() {
        return datasets;
    }

    @Override
    public DatasourceType getType() {
        return DatasourceType.staticDs;
    }


    public List<Dataset> buildDatasets(List<DatasetDefinition> datasetDefs) {
        List<Dataset> datasets = new ArrayList<>();
        for (DatasetDefinition datasetDef : datasetDefs) {
            JsonDatasetDefinition jsonDatasetDef = (JsonDatasetDefinition) datasetDef;
            String content = jsonDatasetDef.getContent();
            //将json数组转换为数据集
            List<Map> maps = JsonUtils.fromJsonList(content, Map.class);
            Dataset dataset = new Dataset(datasetDef.getName(), maps);
            datasets.add(dataset);
        }
        return datasets;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public void setDatasets(List<DatasetDefinition> datasets) {
        this.datasets = datasets;
    }
}
