package com.luck.report.infra.modules.cache.service;

/**
 * 缓存键生成策略
 * @author 24731
 */
public interface ReportCacheKeyResolver {

    /**
     * 是否可用
     * @return
     */
    boolean disabled();

    /**
     * 缓存前缀
     * @return
     */
    String getPrefix();

}
