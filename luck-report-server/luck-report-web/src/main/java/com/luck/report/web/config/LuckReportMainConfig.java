package com.luck.report.web.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * UReport主配置类
 * 导入所有UReport相关的配置类
 * @author luck
 */
@Configuration
@Import({
        LuckReportConsoleConfig.class,
        WebConfig.class
})
public class LuckReportMainConfig {
}
