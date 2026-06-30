package com.luck.report.web.config;

import com.luck.report.web.modules.report.domain.dto.DataSourceItem;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * 动态多数据源配置
 * 基于 AbstractRoutingDataSource 实现数据源动态路由，
 * 配合 @DataSource 注解和 DataSourceAspect 在 Mapper 层切换数据源
 *
 * 数据源规划：
 * - mainDbDataSource：主数据源，从 spring.datasource.* 读取配置，MyBatis 默认使用
 * - vectorDataSource：PostgreSQL 向量存储数据源，由 PgVectorStoreAutoConfiguration 条件创建，
 *   仅当 luck-report.vector.enabled=true 时存在
 * - dynamicDataSource：路由数据源，根据 @DataSource 注解切换，@Primary 供 MyBatis 使用
 *
 * 注意：由于本配置类创建了 DataSource Bean，Spring Boot 的 DataSourceAutoConfiguration
 * 会因 @ConditionalOnMissingBean 跳过自动配置，因此主数据源需手动创建
 *
 * @author luck
 */
@Configuration
@EnableConfigurationProperties({DataSourceProperties.class,
        org.springframework.boot.autoconfigure.jdbc.DataSourceProperties.class})
public class DynamicDataSourceConfig {

    @Bean(name = "dynamicDataSource")
    @Primary
    public DataSource dynamicDataSource(
            org.springframework.boot.autoconfigure.jdbc.DataSourceProperties springDataSourceProperties,
            DataSourceProperties dataSourceProperties) {

        DataSource mainDbDataSource = springDataSourceProperties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();

        DataSource vectorDataSource = createVectorDataSource(dataSourceProperties);

        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                return DataSourceContextHolder.get();
            }
        };

        Map<Object, Object> targetDataSources = new HashMap<>(2);
        targetDataSources.put(DataSourceContextHolder.DEFAULT, mainDbDataSource);

        if (vectorDataSource != null) {
            targetDataSources.put(DataSourceContextHolder.VECTOR, vectorDataSource);
        }

        routing.setTargetDataSources(targetDataSources);
        routing.setDefaultTargetDataSource(mainDbDataSource);
        return routing;
    }

    private DataSource createVectorDataSource(DataSourceProperties dataSourceProperties) {
        DataSourceItem item = dataSourceProperties.getVector();
        if (item == null || item.getUrl() == null) {
            return null;
        }
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
