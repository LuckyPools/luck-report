package com.luck.report.core.config;

import com.luck.report.core.UReportPropertyPlaceholderConfigurer;
import com.luck.report.core.Utils;
import com.luck.report.core.cache.CacheUtils;
import com.luck.report.core.expression.ExpressionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UtilsConfiguration {

    @Bean
    public UReportPropertyPlaceholderConfigurer uReportPropertyPlaceholderConfigurer() {
        UReportPropertyPlaceholderConfigurer configurer = new UReportPropertyPlaceholderConfigurer();
        configurer.setIgnoreUnresolvablePlaceholders(true);
        return configurer;
    }

    @Bean
    public ExpressionUtils expressionUtils() {
        return new ExpressionUtils();
    }

    @Bean
    public Utils utils(@Value("${luck-report.debug:false}") boolean debug) {
        Utils utils = new Utils();
        utils.setDebug(debug);
        return utils;
    }

    @Bean
    public CacheUtils cacheUtils() {
        return new CacheUtils();
    }
}
