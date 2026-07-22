package com.luck.report.config;

import com.luck.report.web.config.LuckReportProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * @author jack
 * @version 1.0
 * @description: springboot3 自动装配类
 * @date 2026-04-30 9:13
 */
@Import(JakartaWebConfig.class)
@EnableConfigurationProperties(LuckReportProperties.class)
@Configuration
@ComponentScan(basePackages = "com.luck.report")
@ConditionalOnProperty(prefix = "luck-report", name = "autoConfig", havingValue = "true", matchIfMissing = true)
public class LuckReportBoot3AutoConfiguration {
}
