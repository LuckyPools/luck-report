/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
package com.luck.report.core.cache;

import com.luck.report.core.chart.ChartData;
import com.luck.report.infra.modules.cache.utils.CacheUtils;

import java.util.Map;

/**
 * 图表缓存
 *
 * @author luckyPools
 * @since 2026年05月15日
 */
public class ChartScopeCache {

    private static final String CACHE_PREFIX = "report:chart:";

    public static String getScopePrefix() {
        return CACHE_PREFIX + CacheUtils.getCacheScopePrefix() + ":";
    }

    public static String getChartKey(String chartId) {
        return getScopePrefix() + chartId;
    }

    /**
     * 按图表 ID 获取。
     */
    public static ChartData getChartData(String chartId) {
        if (chartId == null) {
            return null;
        }
        return CacheUtils.get(getChartKey(chartId), ChartData.class);
    }

    /**
     * 逐条写入
     */
    public static void putChartDataMap(Map<String, ChartData> map) {
        if (map == null || map.isEmpty()) {
            return;
        }
        for (Map.Entry<String, ChartData> entry : map.entrySet()) {
            putChartData(entry.getKey(), entry.getValue());
        }
    }

    /**
     * 写入单个图表。
     */
    public static void putChartData(String chartId, ChartData chartData) {
        if (chartId == null || chartData == null) {
            return;
        }
        CacheUtils.put(getChartKey(chartId), chartData);
    }
}
