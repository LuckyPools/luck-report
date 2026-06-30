package com.luck.report.web.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * 报表系统自动配置类
 * 业务系统集成 luck-report-web 时自动加载报表相关配置
 * @author luck
 */
@Configuration
@ComponentScan(basePackages = {"com.luck.report"})
@ConditionalOnProperty(prefix = "luck-report", name = "autoConfig", havingValue = "true", matchIfMissing = true)
public class ReportAutoConfiguration {

}
