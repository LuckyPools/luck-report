package com.luck.agent.config;

/**
 * 数据源上下文持有者
 * 基于 ThreadLocal 存储当前线程使用的数据源标识
 * 配合 @DataSource 注解和 DataSourceAspect 实现数据源动态切换
 *
 * @author luck
 */
public class DataSourceContextHolder {

    private static final ThreadLocal<String> CONTEXT_HOLDER = new ThreadLocal<>();

    /** 默认数据源标识（Spring Boot 自动装配的主数据源） */
    public static final String DEFAULT = "default";

    /** PostgreSQL 向量存储数据源标识 */
    public static final String PGVECTOR = "pgvector";

    /**
     * 设置当前线程的数据源标识
     *
     * @param key 数据源标识，如 "default"、"pgvector"
     */
    public static void set(String key) {
        CONTEXT_HOLDER.set(key);
    }

    /**
     * 获取当前线程的数据源标识
     *
     * @return 数据源标识，默认 null（走路由的 defaultTargetDataSource）
     */
    public static String get() {
        return CONTEXT_HOLDER.get();
    }

    /**
     * 清除当前线程的数据源标识
     * 必须在请求结束后调用，防止 ThreadLocal 泄露
     */
    public static void clear() {
        CONTEXT_HOLDER.remove();
    }
}
