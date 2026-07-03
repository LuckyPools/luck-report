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

import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.definition.ReportDefinitionWrapper;
import com.luck.report.infra.modules.cache.utils.CacheUtils;

/**
 * 报表定义包装类缓存，用于缓存 ReportDefinitionWrapper 对象。
 *
 *
 * @author luckyPools
 * @since 2026年05月23日
 */
public class ReportDefinitionWrapperCache {

    /**
     * 缓存键前缀
     */
    private static final String CACHE_PREFIX = "report:definition:";

    /**
     * 根据报表文件名获取报表定义包装类。
     *
     * @param file 报表文件名，不能为空
     * @return 报表定义包装类对象，不存在返回 null
     */
    public static ReportDefinitionWrapper getObject(String file) {
        return CacheUtils.get(CACHE_PREFIX + file, ReportDefinitionWrapper.class);
    }

    /**
     * 缓存报表定义包装类。
     *
     * @param file                     报表文件名，作为缓存键，不能为空
     * @param reportDefinitionWrapper  报表定义包装类对象，不能为空
     */
    public static void putObject(String file, ReportDefinitionWrapper reportDefinitionWrapper) {
        CacheUtils.put(CACHE_PREFIX + file, reportDefinitionWrapper);
    }

    /**
     * 缓存报表定义对象（自动包装为 ReportDefinitionWrapper）。
     *
     * @param file               报表文件名，作为缓存键，不能为空
     * @param reportDefinition   报表定义对象，不能为空
     */
    public static void putObject(String file, ReportDefinition reportDefinition) {
        ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDefinition);
        CacheUtils.put(CACHE_PREFIX + file, wrapper);
    }

    /**
     * 移除报表定义包装类缓存。
     *
     * @param file 报表文件名，不能为空
     */
    public static void removeObject(String file) {
        CacheUtils.remove(CACHE_PREFIX + file);
    }
}
