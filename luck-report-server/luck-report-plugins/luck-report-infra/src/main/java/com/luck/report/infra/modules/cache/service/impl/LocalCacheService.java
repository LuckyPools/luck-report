package com.luck.report.infra.modules.cache.service.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;
import com.luck.report.infra.modules.cache.service.ReportCache;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * 本地缓存服务实现，基于 Caffeine 实现高性能内存缓存
 *
 * @author luckyPools
 * @since 2017年3月8日
 */
public class LocalCacheService implements ReportCache {

    /**
     * 是否禁用
     */
    private boolean disabled;

    /**
     * 缓存数据存储，使用 Caffeine Cache 实现
     * 使用 Expiry 策略支持每个缓存项独立的过期时间
     */
    private final Cache<String, CacheEntry> cache;

    /**
     * 构造函数，初始化 Caffeine 缓存。
     */
    public LocalCacheService() {
        this.cache = Caffeine.newBuilder()
                // 使用 Expiry 策略，支持每个缓存项独立的过期时间
                .expireAfter(new Expiry<String, CacheEntry>() {
                    @Override
                    public long expireAfterCreate(String key, CacheEntry value, long currentTime) {
                        // 返回剩余过期时间（纳秒）
                        return value.getRemainingExpireNanos();
                    }

                    @Override
                    public long expireAfterUpdate(String key, CacheEntry value, long currentTime, long currentDuration) {
                        // 更新后重新计算过期时间
                        return value.getRemainingExpireNanos();
                    }

                    @Override
                    public long expireAfterRead(String key, CacheEntry value, long currentTime, long currentDuration) {
                        // 读取时不改变过期时间
                        return currentDuration;
                    }
                })
                // 初始容量
                .initialCapacity(100)
                // 最大容量
                .maximumSize(10000)
                .build();
    }

    /**
     * 缓存条目内部类，封装缓存值和过期时间。
     */
    private static class CacheEntry {
        private final Object value;
        private final long expireTimeNanos;

        /**
         * 构造缓存条目。
         *
         * @param value         缓存值
         * @param expireSeconds 过期时间，单位：秒
         */
        public CacheEntry(Object value, long expireSeconds) {
            this.value = value;
            this.expireTimeNanos = System.nanoTime() + TimeUnit.SECONDS.toNanos(expireSeconds);
        }

        /**
         * 获取剩余过期时间（纳秒）。
         *
         * @return 剩余过期时间，已过期返回 0
         */
        public long getRemainingExpireNanos() {
            long remaining = expireTimeNanos - System.nanoTime();
            return remaining > 0 ? remaining : 0;
        }

        /**
         * 获取缓存值。
         *
         * @return 缓存值
         */
        public Object getValue() {
            return value;
        }
    }

    /**
     * 是否可用
     *
     * @return
     */
    @Override
    public boolean disabled() {
        return disabled;
    }

    /**
     * 设置是否可用
     *
     * @return
     */
    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    /**
     * 根据键获取缓存值。
     *
     * @param key 缓存键，不能为空
     * @param <T> 返回值类型
     * @return 缓存值，不存在或已过期返回 null
     */
    @Override
    public <T> T get(String key) {
        CacheEntry entry = cache.getIfPresent(key);
        if (entry == null) {
            return null;
        }
        @SuppressWarnings("unchecked")
        T value = (T) entry.getValue();
        return value;
    }

    /**
     * 根据键获取缓存值并转换为指定类型。
     *
     * @param key   缓存键，不能为空
     * @param clazz 目标类型，不能为空
     * @param <T>   返回值类型
     * @return 缓存值，不存在或已过期返回 null
     */
    @Override
    public <T> T get(String key, Class<T> clazz) {
        Object value = get(key);
        if (value == null) {
            return null;
        }
        return clazz.cast(value);
    }

    /**
     * 存入缓存，数据将永久存储，不会过期。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param <T>   值类型
     */
    @Override
    public <T> void put(String key, T value) {
        put(key, value, Integer.MAX_VALUE);
    }

    /**
     * 存入缓存，指定过期时间。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param time  过期时间，单位：秒
     * @param <T>   值类型
     */
    @Override
    public <T> void put(String key, T value, long time) {
        if (key == null || value == null) {
            return;
        }
        cache.put(key, new CacheEntry(value, time));
    }

    /**
     * 判断缓存键是否存在且未过期。
     *
     * @param key 缓存键，不能为空
     * @return 存在且未过期返回 true，否则返回 false
     */
    @Override
    public boolean exists(String key) {
        return cache.getIfPresent(key) != null;
    }

    /**
     * 删除指定缓存键。
     *
     * @param key 缓存键，不能为空
     */
    @Override
    public void remove(String key) {
        cache.invalidate(key);
    }

    /**
     * 根据前缀查询匹配的所有缓存键。
     *
     * @param keyPatten 缓存键前缀，不能为空
     * @return 匹配的缓存键集合
     */
    @Override
    public Set<String> keys(String keyPatten) {
        Set<String> result = new HashSet<>();
        if (keyPatten == null) {
            return result;
        }
        // 遍历所有键，收集匹配前缀的键
        for (String key : cache.asMap().keySet()) {
            if (key != null && key.startsWith(keyPatten)) {
                result.add(key);
            }
        }
        return result;
    }

    /**
     * 设置缓存键的过期时间。
     * 注意：Caffeine 不支持直接修改过期时间，此方法通过重新 put 实现更新过期时间。
     *
     * @param key  缓存键，不能为空
     * @param time 过期时间，单位：秒
     * @return 设置成功返回 true，键不存在返回 false
     */
    @Override
    public boolean setExpire(String key, long time) {
        CacheEntry entry = cache.getIfPresent(key);
        if (entry == null) {
            return false;
        }
        // 重新 put 以更新过期时间
        cache.put(key, new CacheEntry(entry.getValue(), time));
        return true;
    }
}
