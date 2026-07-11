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
package com.luck.report.web.domain.vo.cell;

import java.io.Serializable;

/**
 * LinkParameter的VO类，用于前端展示
 * 排除 valueExpression 字段（Expression类型）
 *
 * @author LuckyPools
 * @since 2026年
 */
public class LinkParameterVo implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private String value;

    /**
     * 默认无参构造器
     */
    public LinkParameterVo() {}

    /**
     * 构造函数
     * @param name 参数名
     * @param value 参数值
     */
    public LinkParameterVo(String name, String value) {
        this.name = name;
        this.value = value;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
