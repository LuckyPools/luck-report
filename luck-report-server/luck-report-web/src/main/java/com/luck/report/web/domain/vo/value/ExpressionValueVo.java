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
package com.luck.report.web.domain.vo.value;

import com.luck.report.core.definition.value.ValueType;

import java.io.Serializable;

/**
 * ExpressionValue的VO类，用于前端展示
 * 排除 expression 和 text 字段，仅保留 value 和 type 字段
 *
 * @author LuckyPools
 * @since 2026年
 */
public class ExpressionValueVo implements Serializable {
    private static final long serialVersionUID = 1L;

    private String value;
    private ValueType type;

    /**
     * 默认无参构造器
     */
    public ExpressionValueVo() {}

    /**
     * 构造函数
     * @param value 表达式值
     * @param type 类型
     */
    public ExpressionValueVo(String value, ValueType type) {
        this.value = value;
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public ValueType getType() {
        return type;
    }

    public void setType(ValueType type) {
        this.type = type;
    }
}
