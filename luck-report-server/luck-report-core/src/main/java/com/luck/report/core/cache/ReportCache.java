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


import java.util.Set;

/**
 * @author Jacky.gao
 * @since 2017年3月8日
 */
public interface ReportCache {

    /**
     * 是否可用
     * @return
     */
    boolean disabled();

    /**
     * 根据键获取缓存值。
     *
     * @param key 缓存键，不能为空
     * @param <T> 返回值类型
     * @return 缓存值，不存在或已过期返回 null
     */
    <T> T get(String key);

    /**
     * 根据键获取缓存值并转换为指定类型。
     *
     * @param key   缓存键，不能为空
     * @param clazz 目标类型，不能为空
     * @param <T>   返回值类型
     * @return 缓存值，不存在或已过期返回 null
     */
    <T> T get(String key, Class<T> clazz);


    /**
     * 存入缓存，使用默认过期时间。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param <T>   值类型
     */
    <T> void put(String key, T value);

    /**
     * 存入缓存，指定过期时间。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param time  过期时间，单位：秒
     * @param <T>   值类型
     */
    <T> void put(String key, T value, long time);

    /**
     * 判断缓存键是否存在。
     *
     * @param key 缓存键，不能为空
     * @return 存在且未过期返回 true，否则返回 false
     */
    boolean exists(String key);

    /**
     * 删除指定缓存键。
     *
     * @param key 缓存键，不能为空
     */
    void remove(String key);

    /**
     * 根据前缀查询匹配的所有缓存键。
     *
     * @param keyPatten 缓存键前缀，不能为空
     * @return 匹配的缓存键集合
     */
    Set<String> keys(String keyPatten);

    /**
     * 设置缓存键的过期时间。
     *
     * @param key  缓存键，不能为空
     * @param time 过期时间，单位：秒
     * @return 设置成功返回 true，键不存在或已过期返回 false
     */
    boolean setExpire(String key, long time);

}
