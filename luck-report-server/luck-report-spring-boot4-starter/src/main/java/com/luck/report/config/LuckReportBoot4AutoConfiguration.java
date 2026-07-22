package com.luck.report.config;

import com.luck.report.web.config.LuckReportConsoleConfig;
import com.luck.report.web.config.LuckReportProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;

/**
 * @author jack
 * @version 1.0
 * @description: springboot3 自动装配类
 * @date 2026-04-30 9:13
 */
@EnableConfigurationProperties(LuckReportProperties.class)
@Import({JakartaWebConfig.class, LuckReportConsoleConfig.class})
@Configuration
@ComponentScan(basePackages = "com.luck.report", excludeFilters = {
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com.luck.report.web.config.*"),
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com.luck.report.web.handler.*"),
})
public class LuckReportBoot4AutoConfiguration {
}
