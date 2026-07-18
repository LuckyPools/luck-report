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
package com.luck.report.core.definition.value;



import java.io.Serializable;

/**
 * 普通字符串，或者是表达式
 *
 * @author Jacky.gao
 * @since 2016年11月1日
 */
public class SimpleValue implements Value, Serializable {
    private static final long serialVersionUID = 1L;
    private String value;

    /**
     * 默认无参构造器
     */
    public SimpleValue() {}

    public SimpleValue(String value) {
        this.value = value;
    }

    @Override
    public ValueType getType() {
        return ValueType.simple;
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param type 类型（忽略）
     */
    public void setType(ValueType type) {
        // 空实现，忽略type字段
    }

    @Override
    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
