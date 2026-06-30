/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.web.modules.report.domain.vo.datasource;

import com.luck.report.core.definition.datasource.DatasourceType;
import com.luck.report.web.modules.report.domain.vo.dataset.DatasetDefinitionVo;

import java.io.Serializable;
import java.util.List;

/**
 * 数据源定义 VO（聚合根）
 * 用于前端展示，对应 DatasourceDefinition 的 VO 版本
 * <p>
 * 子类按数据源类型拆分：JDBC / Buildin / SpringBean；
 * 数据集统一存为 SqlDatasetDefinitionVo / BeanDatasetDefinitionVo，
 * 避免将核心模块的 DatasetDefinition（含 sqlExpression）直接序列化到前端
 * </p>
 *
 * @author system
 * @since 2026年
 */
public class DatasourceDefinitionVo implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private DatasourceType type;
    private List<DatasetDefinitionVo> datasets;

    /**
     * 默认无参构造器
     */
    public DatasourceDefinitionVo() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public DatasourceType getType() {
        return type;
    }

    public void setType(DatasourceType type) {
        this.type = type;
    }

    public List<DatasetDefinitionVo> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<DatasetDefinitionVo> datasets) {
        this.datasets = datasets;
    }
}
