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
package com.luck.report.web.domain.vo.dataset;

import com.luck.report.core.definition.dataset.Parameter;
import com.luck.report.web.domain.vo.dataset.DatasetDefinitionVo;

import java.util.List;

/**
 * SQL 数据集定义 VO
 * 用于前端展示，复刻 SqlDatasetDefinition 字段但过滤 sqlExpression（前端不依赖该表达式对象）
 *
 * @author system
 * @since 2026年
 */
public class SqlDatasetDefinitionVo extends DatasetDefinitionVo {
    private static final long serialVersionUID = 1L;

    private String sql;
    private List<Parameter> parameters;

    /**
     * 默认无参构造器
     */
    public SqlDatasetDefinitionVo() {}

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    public List<Parameter> getParameters() {
        return parameters;
    }

    public void setParameters(List<Parameter> parameters) {
        this.parameters = parameters;
    }
}
