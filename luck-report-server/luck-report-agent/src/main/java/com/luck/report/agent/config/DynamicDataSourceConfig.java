package com.luck.report.agent.config;

import com.luck.report.agent.domain.dto.DataSourceItem;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
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
 * - pgVectorDataSource：PostgreSQL 向量存储数据源，从 luck-report.datasource.vector.* 读取配置
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

    /**
     * 主数据源（HikariCP）
     * 从标准 spring.datasource.* 配置创建，供 ChatSessionMapper 等默认 Mapper 使用
     *
     * @param springDataSourceProperties Spring Boot 标准数据源配置，绑定 spring.datasource.* 前缀
     * @return MySQL HikariDataSource
     */
    @Bean(name = "mainDbDataSource")
    public DataSource mainDbDataSource(org.springframework.boot.autoconfigure.jdbc.DataSourceProperties springDataSourceProperties) {
        return springDataSourceProperties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    /**
     * 向量存储数据源（HikariCP）
     * 从 luck-report.datasource.vector.* 读取配置
     *
     * @param dataSourceProperties 自定义数据源配置，绑定 luck-report.datasource 前缀
     */
    @Bean(name = "vectorDataSource")
    public DataSource pgVectorDataSource(DataSourceProperties dataSourceProperties) {
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

    /**
     * 动态路由数据源
     * 根据 DataSourceContextHolder 中的标识选择目标数据源
     * 默认指向主数据源，@DataSource("vector") 注解可切换到 vector
     *
     * @param mainDbDataSource   主数据源（来自 spring.datasource.*）
     * @param vectorDataSource   PostgreSQL 向量存储数据源
     * @return 路由数据源
     */
    @Bean(name = "dynamicDataSource")
    @Primary
    public DataSource dynamicDataSource(@Qualifier("mainDbDataSource") DataSource mainDbDataSource,
                                        @Qualifier("vectorDataSource") DataSource vectorDataSource) {
        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                return DataSourceContextHolder.get();
            }
        };

        Map<Object, Object> targetDataSources = new HashMap<>(2);
        targetDataSources.put(DataSourceContextHolder.DEFAULT, mainDbDataSource);
        targetDataSources.put(DataSourceContextHolder.VECTOR, vectorDataSource);

        routing.setTargetDataSources(targetDataSources);
        routing.setDefaultTargetDataSource(mainDbDataSource);
        return routing;
    }

}
