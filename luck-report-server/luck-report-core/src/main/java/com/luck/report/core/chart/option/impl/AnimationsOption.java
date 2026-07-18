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
package com.luck.report.core.chart.option.impl;

import com.luck.report.core.chart.option.Easing;
import com.luck.report.core.chart.option.Option;

import java.io.Serializable;

/**
 * @author Jacky.gao
 * @since 2017年6月8日
 */
public class AnimationsOption implements Option, Serializable {
    private static final long serialVersionUID = 1L;

    public AnimationsOption() {}
    private int duration = 1000;
    private Easing easing = Easing.easeOutQuart;

    @Override
    public String buildOptionJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("\"animation\":{");
        sb.append("\"duration\":" + duration + ",");
        sb.append("\"easing\":\"" + easing + "\"");
        sb.append("}");
        return sb.toString();
    }

    @Override
    public String getType() {
        return "animation";
    }

    /**
     * 空实现，用于兼容JSON反序列化时可能存在的type字段
     * @param type 类型（忽略）
     */
    public void setType(String type) {
        // 空实现，忽略type字段
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public Easing getEasing() {
        return easing;
    }

    public void setEasing(Easing easing) {
        this.easing = easing;
    }
}
