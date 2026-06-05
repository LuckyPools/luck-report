package com.luck.report.agent.config;

import com.luck.report.agent.domain.dto.DataSourceItem;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 自定义数据源配置绑定类
 * 从 application.yml 的 luck-report.datasource 前缀读取 vector 数据源配置
 * 主数据源使用标准 spring.datasource.* 配置，由 Spring Boot 自动装配
 *
 * @author luck
 */
@Data
@ConfigurationProperties(prefix = "luck-report.datasource")
public class DataSourceProperties {

    /** 向量存储数据源配置 */
    private DataSourceItem vector;
}
