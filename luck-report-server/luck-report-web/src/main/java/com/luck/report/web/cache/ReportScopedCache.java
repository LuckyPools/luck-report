package com.luck.report.web.cache;

import com.luck.report.infra.modules.cache.utils.CacheUtils;

/**
 * 临时报表对象缓存工具类，用于缓存报表预览等临时数据。
 * 默认采用会话 id 隔离用户数据
 *
 * @author luckyPools
 * @since 2026年06月16日
 */
public class ReportScopedCache {

    /**
     * 缓存键前缀
     */
    private static final String CACHE_PREFIX = "report:temp:";

    /**
     * 过期时间，单位：秒
     */
    private static final long EXPIRE_SECONDS = 5 * 60L;


    public static String getCacheKey(String key){
        return CACHE_PREFIX + CacheUtils.getCacheScopePrefix() + ":" + key;
    }


    /**
     * 从缓存获取临时对象。
     * 默认根据当前请求的 Session ID 构建缓存键，实现 Session 级别的数据隔离。
     *
     * @param key 缓存键，不能为空
     * @return 缓存对象，不存在或 Session 无效返回 null
     */
    public static Object getObject(String key) {
        String cacheKey = getCacheKey(key);
        return CacheUtils.get(cacheKey);
    }

    /**
     * 存入临时对象到缓存。
     * 默认根据当前请求的 Session ID 构建缓存键，实现 Session 级别的数据隔离。
     *
     * @param key 缓存键，不能为空
     * @param obj 缓存对象，不能为空
     */
    public static void putObject(String key, Object obj) {
        String cacheKey = getCacheKey(key);
        CacheUtils.put(cacheKey, obj, EXPIRE_SECONDS);
    }

    /**
     * 从缓存移除临时对象。
     *
     * @param key 缓存键，不能为空
     */
    public static void removeObject(String key) {
        String cacheKey = getCacheKey(key);
        CacheUtils.remove(cacheKey);
    }


}
