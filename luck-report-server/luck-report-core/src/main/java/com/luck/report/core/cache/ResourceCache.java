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

/**
 * 图片资源缓存工具类，用于缓存报表中使用的图片资源。
 *
 * @author Jacky.gao
 * @since 2017年3月17日
 */
public class ResourceCache {

    /**
     * 缓存键前缀
     */
    private static final String CACHE_PREFIX = "report:resource:";

    /**
     * 存入图片资源到缓存。
     *
     * @param key 资源键，不能为空
     * @param obj 资源对象，不能为空
     */
    public static void putObject(String key, Object obj) {
        CacheUtils.put(CACHE_PREFIX + key, obj);
    }

    /**
     * 从缓存获取图片资源。
     *
     * @param key 资源键，不能为空
     * @return 资源对象，不存在返回 null
     */
    public static Object getObject(String key) {
        return CacheUtils.get(CACHE_PREFIX + key);
    }

    /**
     * 从缓存移除图片资源。
     *
     * @param key 资源键，不能为空
     */
    public static void removeObject(String key) {
        CacheUtils.remove(CACHE_PREFIX + key);
    }
}
