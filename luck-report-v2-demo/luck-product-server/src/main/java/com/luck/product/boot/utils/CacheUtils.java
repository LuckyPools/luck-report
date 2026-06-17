package com.luck.product.boot.utils;

import cn.hutool.core.lang.Assert;
import org.springframework.data.redis.core.RedisTemplate;


/**
 * 内存缓存工具类
 * 替代 RedisCacheUtils，使用本地内存实现缓存功能
 * @author luck
 */
public class CacheUtils {

    /**
     * 静态持有 RedisTemplate 实例
     */
    private static RedisTemplate<String, Object> redisTemplate;

    /**
     * 双重校验锁 懒汉式加载 RedisTemplate
     */
    private static RedisTemplate<String, Object> getRedisTemplate() {
        if (redisTemplate == null) {
            synchronized (CacheUtils.class) {
                if (redisTemplate == null) {
                    // 从Spring容器获取 RedisTemplate<String, Object>
                    redisTemplate = SpringContextUtils.getBean("remoteRedisTemplate",RedisTemplate.class);
                    Assert.notNull(redisTemplate, "RedisTemplate 未注入到Spring容器");
                }
            }
        }
        return redisTemplate;
    }

    /**
     * 获取缓存
     */
    @SuppressWarnings("unchecked")
    public static <T> T get(String key) {
        RedisTemplate<String, Object> template = getRedisTemplate();
        return (T) template.opsForValue().get(key);
    }

    /**
     * 设置缓存（永久有效）
     */
    public static void set(String key, Object value) {
        RedisTemplate<String, Object> template = getRedisTemplate();
        template.opsForValue().set(key, value);
    }

    /**
     * 设置缓存（带过期时间，单位秒）
     */
    public static void set(String key, Object value, long timeout) {
        RedisTemplate<String, Object> template = getRedisTemplate();
        template.opsForValue().set(key, value, timeout, java.util.concurrent.TimeUnit.SECONDS);
    }
}
