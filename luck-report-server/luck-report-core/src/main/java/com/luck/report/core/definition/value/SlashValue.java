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
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年3月14日
 */
public class SlashValue implements Value, Serializable {
    private static final long serialVersionUID = 1L;
    private String svg;
    private List<Slash> slashes;
    private String base64Data;

    /**
     * 默认无参构造器
     */
    public SlashValue() {}

    @Override
    public String getValue() {
        return null;
    }

    public String getSvg() {
        return svg;
    }

    public void setSvg(String svg) {
        this.svg = svg;
    }

    public List<Slash> getSlashes() {
        return slashes;
    }

    public void setSlashes(List<Slash> slashes) {
        this.slashes = slashes;
    }

    @Override
    public ValueType getType() {
        return ValueType.slash;
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param type 类型（忽略）
     */
    public void setType(ValueType type) {
        // 空实现，忽略type字段
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的value字段
     * @param value 值（忽略）
     */
    public void setValue(String value) {
        // 空实现，忽略value字段
    }

    public String getBase64Data() {
        return base64Data;
    }

    public void setBase64Data(String base64Data) {
        this.base64Data = base64Data;
    }
}
