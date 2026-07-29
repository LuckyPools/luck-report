package com.luck.report.redis.cache;

import com.luck.report.infra.modules.cache.service.ReportCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis 缓存服务实现，基于 Spring Data Redis 提供分布式缓存能力。
 * 由 RedisCacheAutoConfiguration 自动装配，CacheUtils 在运行时选取首个非 disabled 的 ReportCache 实例。
 *
 * @author luckyPools
 * @since 2017年3月8日
 */
public class RedisCache implements ReportCache {

    private static final Logger log = LoggerFactory.getLogger(RedisCache.class);

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 构造 RedisCache 实例。
     *
     * @param redisTemplate Redis 操作模板，不能为空
     */
    public RedisCache(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 检查 Redis 缓存服务是否可用。
     *
     * @return Redis 不可用返回 true，可用返回 false
     */
    @Override
    public boolean disabled() {
        try {
            RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
            try {
                connection.ping();
                return false;
            } finally {
                // 归还连接到连接池，避免连接泄漏
                connection.close();
            }
        } catch (Exception e) {
            log.error("检查 Redis 连接状态失败", e);
            return true;
        }
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
        if (key == null) {
            return null;
        }
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            @SuppressWarnings("unchecked")
            T result = (T) value;
            return result;
        } catch (Exception e) {
            log.error("获取缓存失败，key: {}", key, e);
            return null;
        }
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
        if (key == null || clazz == null) {
            return null;
        }
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            if (clazz.isInstance(value)) {
                return clazz.cast(value);
            }
            return null;
        } catch (Exception e) {
            log.error("获取缓存并转换类型失败，key: {}, clazz: {}", key, clazz.getName(), e);
            return null;
        }
    }

    /**
     * 存入缓存，不设置过期时间。
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param <T>   值类型
     */
    @Override
    public <T> void put(String key, T value) {
        if (key == null || value == null) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("存入缓存失败，key: {}", key, e);
        }
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
        try {
            if (time > 0) {
                redisTemplate.opsForValue().set(key, value, time, TimeUnit.SECONDS);
            } else {
                redisTemplate.opsForValue().set(key, value);
            }
        } catch (Exception e) {
            log.error("存入缓存失败，key: {}, time: {}", key, time, e);
        }
    }

    /**
     * 判断缓存键是否存在。
     *
     * @param key 缓存键，不能为空
     * @return 存在且未过期返回 true，否则返回 false
     */
    @Override
    public boolean exists(String key) {
        if (key == null) {
            return false;
        }
        try {
            Boolean hasKey = redisTemplate.hasKey(key);
            return hasKey != null && hasKey;
        } catch (Exception e) {
            log.error("判断缓存键是否存在失败，key: {}", key, e);
            return false;
        }
    }

    /**
     * 删除指定缓存键。
     *
     * @param key 缓存键，不能为空
     */
    @Override
    public void remove(String key) {
        if (key == null) {
            return;
        }
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("删除缓存失败，key: {}", key, e);
        }
    }

    /**
     * 根据前缀查询匹配的所有缓存键。
     *
     * @param keyPatten 缓存键前缀，不能为空
     * @return 匹配的缓存键集合
     */
    @Override
    public Set<String> keys(String keyPatten) {
        if (keyPatten == null) {
            return null;
        }
        try {
            return redisTemplate.keys(keyPatten + "*");
        } catch (Exception e) {
            log.error("查询缓存键失败，keyPatten: {}", keyPatten, e);
            return null;
        }
    }

    /**
     * 设置缓存键的过期时间。
     *
     * @param key  缓存键，不能为空
     * @param time 过期时间，单位：秒
     * @return 设置成功返回 true，键不存在或已过期返回 false
     */
    @Override
    public boolean setExpire(String key, long time) {
        if (key == null || time <= 0) {
            return false;
        }
        try {
            Boolean result = redisTemplate.expire(key, time, TimeUnit.SECONDS);
            return result != null && result;
        } catch (Exception e) {
            log.error("设置缓存过期时间失败，key: {}, time: {}", key, time, e);
            return false;
        }
    }
}
