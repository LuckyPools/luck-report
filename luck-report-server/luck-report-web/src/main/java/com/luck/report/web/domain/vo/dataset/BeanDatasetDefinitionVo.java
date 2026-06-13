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

/**
 * Bean 数据集定义 VO
 * 用于前端展示，复刻 BeanDatasetDefinition 字段
 *
 * @author system
 * @since 2026年
 */
public class BeanDatasetDefinitionVo extends DatasetDefinitionVo {
    private static final long serialVersionUID = 1L;

    private String method;
    private String clazz;

    /**
     * 默认无参构造器
     */
    public BeanDatasetDefinitionVo() {}

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getClazz() {
        return clazz;
    }

    public void setClazz(String clazz) {
        this.clazz = clazz;
    }
}
