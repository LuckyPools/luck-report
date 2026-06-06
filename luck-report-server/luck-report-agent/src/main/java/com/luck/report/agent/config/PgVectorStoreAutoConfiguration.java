package com.luck.report.agent.config;

import com.luck.report.agent.domain.dto.DataSourceItem;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * PostgreSQL + vector 向量存储自动配置
 * 仅当 luck-report.vector.enabled=true（或未配置）时生效
 * 第三方应用设置 luck-report.vector.enabled=false 即可禁用本配置，
 * 自行提供 VectorStore 实现和对应的数据源
 *
 * 包含：
 * 1. vectorDataSource：PostgreSQL 向量数据源
 * 2. VectorDocumentMapper 扫描：vector 专有 SQL 的 Mapper
 *
 * @author luck
 */
@Configuration
@ConditionalOnProperty(name = "luck-report.vector.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties({DataSourceProperties.class})
@MapperScan(basePackages = "com.luck.report.agent.modules.vector.mapper",
        sqlSessionFactoryRef = "sqlSessionFactory")
public class PgVectorStoreAutoConfiguration {

    /**
     * 向量存储数据源（HikariCP）
     * 从 luck-report.datasource.vector.* 读取配置
     *
     * @param dataSourceProperties 自定义数据源配置，绑定 luck-report.datasource 前缀
     * @return PostgreSQL HikariDataSource
     */
    @Bean(name = "vectorDataSource")
    public DataSource vectorDataSource(DataSourceProperties dataSourceProperties) {
        DataSourceItem item = dataSourceProperties.getVector();
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(item.getUrl());
        config.setUsername(item.getUsername());
        config.setPassword(item.getPassword());
        config.setDriverClassName(item.getDriverClassName());
        config.setMaximumPoolSize(item.getMaximumPoolSize());
        config.setPoolName("vector-pool");
        return new HikariDataSource(config);
    }
}
