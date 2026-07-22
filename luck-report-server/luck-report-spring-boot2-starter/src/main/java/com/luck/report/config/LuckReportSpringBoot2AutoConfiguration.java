package com.luck.report.config;

import com.luck.report.web.config.LuckReportConsoleConfig;
import com.luck.report.web.config.LuckReportProperties;
import com.luck.report.web.config.WebConfig;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * @author jack
 * @version 1.0
 * @description: springboot2 starter 自动装配类
 * @date 2026-07-22 8:39
 */
@EnableConfigurationProperties(LuckReportProperties.class)
@Import({WebConfig.class, LuckReportConsoleConfig.class})
@Configuration
public class LuckReportSpringBoot2AutoConfiguration {


}
