package com.luck.report.web.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * PostgreSQL + vector 向量存储自动配置
 * 仅当 luck-report.vector.enabled=true（或未配置）时生效
 * 第三方应用设置 luck-report.vector.enabled=false 即可禁用本配置，
 * 自行提供 VectorStore 实现和对应的数据源
 *
 * 包含：
 * 1. VectorDocumentMapper 扫描：vector 专有 SQL 的 Mapper
 * 2. vectorDataSource 由 DynamicDataSourceConfig 统一内联创建，避免循环依赖
 *
 * @author luck
 */
@Configuration
@ConditionalOnProperty(name = "luck-report.vector.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties({DataSourceProperties.class})
@MapperScan(basePackages = "com.luck.report.web.modules.vector.mapper",
        sqlSessionFactoryRef = "sqlSessionFactory")
public class PgVectorStoreAutoConfiguration {

}
