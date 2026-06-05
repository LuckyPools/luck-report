package com.luck.report.agent.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 缓存操作工具类
 * 提供简易的本地缓存功能，基于 ConcurrentHashMap 实现
 * 用于缓存模型配置等数据，避免频繁从数据库读取
 *
 * @author luck
 */
public class CacheUtils {

    private static final Logger log = LoggerFactory.getLogger(CacheUtils.class);

    /** 本地缓存存储，key=缓存键，value=缓存值 */
    private static final Map<String, Object> cache = new ConcurrentHashMap<>();

    /** 缓存键前缀：模型配置 */
    public static final String MODEL_CONFIG_PREFIX = "model_config:";

    /** 缓存键：所有激活的对话模型列表 */
    public static final String ACTIVE_CHAT_MODELS_KEY = MODEL_CONFIG_PREFIX + "active_chat_models";

    /** 缓存键：所有激活的嵌入模型列表 */
    public static final String ACTIVE_EMBEDDING_MODELS_KEY = MODEL_CONFIG_PREFIX + "active_embedding_models";

    /** 缓存键：单个模型配置（后缀为模型ID） */
    public static final String MODEL_BY_ID_PREFIX = MODEL_CONFIG_PREFIX + "id:";

    /**
     * 根据键获取缓存值
     *
     * @param key 缓存键，不能为空
     * @param <T> 返回值类型
     * @return 缓存值，不存在返回 null
     */
    @SuppressWarnings("unchecked")
    public static <T> T get(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        T value = (T) cache.get(key);
        if (value != null) {
            log.debug("从缓存读取成功: key={}", key);
        }
        return value;
    }

    /**
     * 根据键获取缓存值并转换为指定类型
     *
     * @param key   缓存键，不能为空
     * @param clazz 目标类型，不能为空
     * @param <T>   返回值类型
     * @return 缓存值，不存在或类型不匹配返回 null
     */
    public static <T> T get(String key, Class<T> clazz) {
        if (key == null || key.isEmpty() || clazz == null) {
            return null;
        }
        Object value = cache.get(key);
        if (value != null && clazz.isInstance(value)) {
            log.debug("从缓存读取成功: key={}, type={}", key, clazz.getSimpleName());
            return clazz.cast(value);
        }
        return null;
    }

    /**
     * 存入缓存
     *
     * @param key   缓存键，不能为空
     * @param value 缓存值，不能为空
     * @param <T>   值类型
     */
    public static <T> void put(String key, T value) {
        if (key == null || key.isEmpty() || value == null) {
            log.warn("缓存键或值不能为空: key={}, value={}", key, value);
            return;
        }
        cache.put(key, value);
        log.debug("缓存写入成功: key={}", key);
    }

    /**
     * 判断缓存键是否存在
     *
     * @param key 缓存键，不能为空
     * @return 存在返回 true，否则返回 false
     */
    public static boolean exists(String key) {
        if (key == null || key.isEmpty()) {
            return false;
        }
        return cache.containsKey(key);
    }

    /**
     * 删除指定缓存键
     *
     * @param key 缓存键，不能为空
     */
    public static void remove(String key) {
        if (key == null || key.isEmpty()) {
            log.warn("缓存键不能为空");
            return;
        }
        cache.remove(key);
        log.debug("缓存删除成功: key={}", key);
    }

    /**
     * 删除所有模型配置相关的缓存
     * 当模型配置发生变更时调用，清空所有模型配置缓存
     */
    public static void clearModelConfigCache() {
        // 删除所有以 MODEL_CONFIG_PREFIX 开头的缓存键
        cache.keySet().stream()
                .filter(key -> key.startsWith(MODEL_CONFIG_PREFIX))
                .forEach(key -> {
                    cache.remove(key);
                    log.debug("清空模型配置缓存: key={}", key);
                });
        log.info("已清空所有模型配置缓存");
    }

    /**
     * 删除指定模型ID的缓存
     *
     * @param modelId 模型ID
     */
    public static void removeModelById(Integer modelId) {
        if (modelId == null) {
            return;
        }
        String key = MODEL_BY_ID_PREFIX + modelId;
        remove(key);
    }

    /**
     * 清空所有缓存
     * 谨慎使用，仅在需要完全重置缓存时调用
     */
    public static void clearAll() {
        cache.clear();
        log.info("已清空所有缓存");
    }

    /**
     * 获取缓存大小
     *
     * @return 缓存中的键数量
     */
    public static int size() {
        return cache.size();
    }
}
