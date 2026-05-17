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
package com.luck.report.core.chart.dataset.impl.category;

import com.luck.report.core.build.Context;
import com.luck.report.core.model.Cell;

/**
 * @author Jacky.gao
 * @since 2017年6月8日
 */
public class LineDataset extends CategoryDataset {
    private static final long serialVersionUID = 1L;

    public LineDataset() {}

    private double lineTension = 0.2;

    @Override
    public String buildDataJson(Context context, Cell cell) {
        String props = "\"lineTension\":" + lineTension;
        String datasetJson = buildDatasetJson(context, cell, props);
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        String labels = getLabels();
        sb.append("\"labels\":" + labels + ",");
        sb.append("\"datasets\":[" + datasetJson + "]");
        sb.append("}");
        return sb.toString();
    }

    public String toMixJson(Context context, Cell cell, int index) {
        String props = "\"type\":\"line\",\"lineTension\":" + lineTension + ",\"fill\":false";
        String datasetJson = buildDatasetJson(context, cell, props);
        return datasetJson;
    }

    @Override
    public String getType() {
        return "line";
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param type 类型（忽略）
     */
    public void setType(String type) {
        // 空实现，忽略type字段
    }

    public double getLineTension() {
        return lineTension;
    }

    public void setLineTension(double lineTension) {
        this.lineTension = lineTension;
    }
}
