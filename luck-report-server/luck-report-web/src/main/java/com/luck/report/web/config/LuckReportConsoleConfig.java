package com.luck.report.web.config;

import com.luck.report.web.cache.HttpSessionReportCache;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * UReport控制台配置类
 * @author 24731
 */
@Configuration
@ComponentScan(basePackages = {"com.luck.report.core.config", "com.luck.report.font.config"})
public class LuckReportConsoleConfig {

    /**
     * 配置HttpSessionReportCache Bean
     * 用于在HTTP会话中缓存报表数据
     *
     * @param reportDisableHttpSessionReportCache 是否禁用HTTP会话报表缓存
     * @return HttpSessionReportCache实例
     */
    @Bean("bean.httpSessionReportCache")
    public HttpSessionReportCache httpSessionReportCache(
            @Value("${luck-report.disableHttpSessionReportCache:false}") boolean reportDisableHttpSessionReportCache) {
        HttpSessionReportCache cache = new HttpSessionReportCache();
        cache.setDisabled(reportDisableHttpSessionReportCache);
        return cache;
    }
}
