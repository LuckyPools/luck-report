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
package com.luck.report.core.chart.plugins;

import java.io.Serializable;

/**
 * @author Jacky.gao
 * @since 2018年7月6日
 */
public class DataLabelsPlugin implements Plugin, Serializable {
    private static final long serialVersionUID = 1L;

    public DataLabelsPlugin() {}
    private boolean display;

    @Override
    public String getName() {
        return "data-labels";
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param name
     */
    public void setName(String name) {
        // 空实现，忽略name字段
    }

    @Override
    public String toJson(String type) {
        StringBuilder sb = new StringBuilder();
        sb.append("\"datalabels\":{\"display\":" + display + ",");
        sb.append("\"font\":{");
        sb.append("\"size\":14,");
        sb.append("\"weight\":\"bold\"");
        sb.append("}");
        sb.append("}");
        return sb.toString();
    }

    public boolean isDisplay() {
        return display;
    }

    public void setDisplay(boolean display) {
        this.display = display;
    }
}
