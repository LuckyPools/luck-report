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
package com.luck.report.core.cache;

import com.luck.report.infra.modules.cache.utils.CacheUtils;
import com.luck.report.core.chart.ChartData;

import java.util.Map;

/**
 * 图表缓存操作工具类。
 * @author luckyPools
 * @since 2026年05月15日
 */
public class ChartScopeCache {

    /**
     * 图表数据缓存键
     */
    private static final String CACHE_PREFIX = "report:chart:";


    public static String getCacheKey(){
        return CACHE_PREFIX + CacheUtils.getCacheScopePrefix();
    }


    /**
     * 根据图表 ID 获取图表数据。
     *
     * @param chartId 图表 ID，不能为空
     * @return 图表数据，不存在返回 null
     */
    @SuppressWarnings("unchecked")
    public static ChartData getChartData(String chartId) {
        String cacheKey = getCacheKey();
        Map<String, ChartData> chartDataMap = CacheUtils.get(cacheKey, Map.class);;
        if (chartDataMap != null) {
            return chartDataMap.get(chartId);
        }
        return null;
    }

    /**
     * 存储图表数据映射表。
     *
     * @param map 图表数据映射表，不能为空
     */
    public static void storeChartDataMap(Map<String, ChartData> map) {
        if (map == null || map.isEmpty()) {
            return;
        }
        String cacheKey = getCacheKey();
        CacheUtils.put(cacheKey, map);
    }

    /**
     * 更新单个图表数据到缓存中
     * @param chartId  图表 ID，不能为空
     * @param chartData 图表数据，不能为空
     */
    @SuppressWarnings("unchecked")
    public static void putChartData(String chartId, ChartData chartData) {
        if (chartId == null || chartData == null) {
            return;
        }
        String cacheKey = getCacheKey();
        Map<String, ChartData> chartDataMap = CacheUtils.get(cacheKey, Map.class);
        if (chartDataMap != null) {
            chartDataMap.put(chartId, chartData);
            CacheUtils.put(cacheKey, chartDataMap);
        }
    }
}
