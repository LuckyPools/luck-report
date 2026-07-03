package com.luck.report.web.config;

import com.luck.report.infra.modules.cache.service.ReportCache;
import com.luck.report.infra.modules.cache.service.ReportCacheKeyResolver;
import com.luck.report.infra.modules.cache.service.impl.LocalCacheService;
import com.luck.report.web.cache.impl.SessionCacheKeyResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * UReport控制台配置类
 * @author 24731
 */
@Configuration
public class ReportConsoleConfig {

    /**
     * 配置 LocalCacheService Bean
     * 用于在本地缓存报表数据
     *
     * @param disableLocalReportCache 是否禁用本地报表缓存
     * @return HttpSessionReportCache实例
     */
    @Bean("bean.localCacheService")
    public ReportCache localCacheService(
            @Value("${luck-report.disableLocalReportCache:false}") boolean disableLocalReportCache) {
        LocalCacheService cache = new LocalCacheService();
        cache.setDisabled(disableLocalReportCache);
        return cache;
    }

    /**
     * 配置 ReportCacheKeyResolver Bean
     * 使用session会话生成缓存键前缀，隔离用户数据
     *
     * @param disableSessionCacheKeyResolver 是否禁用session缓存键生成器
     * @return HttpSessionReportCache实例
     */
    @Bean("bean.sessionCacheKeyResolver")
    public ReportCacheKeyResolver sessionCacheKeyResolver(
            @Value("${luck-report.disableSessionCacheKeyResolver:false}") boolean disableSessionCacheKeyResolver) {
        SessionCacheKeyResolver resolver = new SessionCacheKeyResolver();
        resolver.setDisabled(disableSessionCacheKeyResolver);
        return resolver;
    }
}
