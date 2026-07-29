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
package com.luck.report.infra.modules.cache.utils;


import com.luck.report.infra.exception.BeanException;
import com.luck.report.infra.modules.cache.service.ReportCache;
import com.luck.report.infra.modules.cache.service.ReportCacheKeyResolver;
import com.luck.report.infra.utils.SpringBeanUtils;

import java.util.Collection;
import java.util.Set;

/**
 * 缓存操作统一入口工具类。
 * @author luckyPools
 * @since 2026年05月15日
 */
public class CacheUtils {

    /**
     * 通用缓存服务实例，使用 volatile 保证多线程可见性
     */
    private static volatile ReportCache reportCache;

    /**
     * 缓存前缀
     */
    private static volatile ReportCacheKeyResolver reportCacheKeyResolver;

    /**
     * 获取缓存服务实例，使用双重检查锁定保证线程安全。
     *
     * @return 缓存服务实例
     * @throws IllegalStateException 当缓存服务未初始化时抛出
     */
    private static ReportCache getReportCache() {
        if (reportCache == null) {
            synchronized (CacheUtils.class) {
                if (reportCache == null) {
                    Collection<ReportCache> services = SpringBeanUtils.getBeans(ReportCache.class);
                    for (ReportCache cache : services) {
                        if (cache.disabled()) {
                            continue;
                        }
                        reportCache = cache;
                        break;
                    }
                    if (reportCache == null) {
                        throw new BeanException("Missing ReportCache implementation. Please verify your configuration.");
                    }
                }
            }
        }
        return reportCache;
    }


    /**
     * 获取缓存服务实例，使用双重检查锁定保证线程安全。
     *
     * @return 缓存服务实例
     * @throws IllegalStateException 当缓存服务未初始化时抛出
     */
    private static ReportCacheKeyResolver getReportCacheKeyResolver() {
        if (reportCacheKeyResolver == null) {
            synchronized (CacheUtils.class) {
                if (reportCacheKeyResolver == null) {
                    Collection<ReportCacheKeyResolver> services = SpringBeanUtils.getBeans(ReportCacheKeyResolver.class);
                    for (ReportCacheKeyResolver resolver : services) {
                        if (resolver.disabled()) {
                            continue;
                        }
                        reportCacheKeyResolver = resolver;
                        break;
                    }
                    if (reportCacheKeyResolver == null) {
                        throw new BeanException("Missing ReportCacheKeyResolver implementation. Please verify your configuration.");
                    }
                }
            }
        }
        return reportCacheKeyResolver;
    }


    /**
     * 根据键获取缓存值。
     *
     * @param key 缓存键，不能为空
     * @param <T> 返回值类型
     * @return 缓存值，不存在或已过期返回 null
     */
    public static <T> T get(String key) {
        return getReportCache().get(key);
    }

    /**
     * 根据键获取缓存值并转换为指定类型。
     *
     * @param key   缓存键，不能为空
     * @param clazz 目标类型，不能为空
     * @param <T>   返回值类型
     * @return 缓存值，不存在或已过期返回 null
     */
    public static <T> T get(String key, Class<T> clazz) {
        return getReportCache().get(key, clazz);
    }

    /**
     * 存入缓存，使用默认过期时间（5 分钟）。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param <T>   值类型
     */
    public static <T> void put(String key, T value) {
        getReportCache().put(key, value);
    }

    /**
     * 存入缓存，指定过期时间。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param time  过期时间，单位：秒
     * @param <T>   值类型
     */
    public static <T> void put(String key, T value, long time) {
        getReportCache().put(key, value, time);
    }

    /**
     * 判断缓存键是否存在且未过期。
     *
     * @param key 缓存键，不能为空
     * @return 存在且未过期返回 true，否则返回 false
     */
    public static boolean exists(String key) {
        return getReportCache().exists(key);
    }

    /**
     * 删除指定缓存键。
     *
     * @param key 缓存键，不能为空
     */
    public static void remove(String key) {
        getReportCache().remove(key);
    }

    /**
     * 根据前缀查询匹配的所有缓存键。
     *
     * @param keyPatten 缓存键前缀，不能为空
     * @return 匹配的缓存键集合
     */
    public static Set<String> keys(String keyPatten) {
        return getReportCache().keys(keyPatten);
    }

    /**
     * 设置缓存键的过期时间。
     *
     * @param key  缓存键，不能为空
     * @param time 过期时间，单位：秒
     * @return 设置成功返回 true，键不存在或已过期返回 false
     */
    public static boolean setExpire(String key, long time) {
        return getReportCache().setExpire(key, time);
    }


    /**
     * 获取隔离缓存前缀
     * @return
     */
    public static String getCacheScopePrefix(){
        return getReportCacheKeyResolver().getPrefix();
    }
}
