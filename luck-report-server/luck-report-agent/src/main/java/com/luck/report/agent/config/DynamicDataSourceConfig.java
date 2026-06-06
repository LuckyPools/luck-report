package com.luck.report.agent.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
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
     * 向量存储数据源（可选注入）
     * 由 PgVectorStoreAutoConfiguration 条件创建，当 enabled=false 时不存在
     * 使用 required=false 避免第三方不使用 vector 时启动报错
     */
    @Autowired(required = false)
    @Qualifier("vectorDataSource")
    private DataSource vectorDataSource;

    /**
     * 动态路由数据源
     * 根据 DataSourceContextHolder 中的标识选择目标数据源
     * 默认指向主数据源，@DataSource("vector") 注解可切换到 vector
     * 当 vectorDataSource 不存在时（第三方自定义实现），仅注册主数据源
     *
     * @param mainDbDataSource 主数据源（来自 spring.datasource.*）
     * @return 路由数据源
     */
    @Bean(name = "dynamicDataSource")
    @Primary
    public DataSource dynamicDataSource(@Qualifier("mainDbDataSource") DataSource mainDbDataSource) {
        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                return DataSourceContextHolder.get();
            }
        };

        Map<Object, Object> targetDataSources = new HashMap<>(2);
        targetDataSources.put(DataSourceContextHolder.DEFAULT, mainDbDataSource);

        // 仅当 vector 数据源存在时注册，第三方自定义实现时无需 vector 数据源
        if (vectorDataSource != null) {
            targetDataSources.put(DataSourceContextHolder.VECTOR, vectorDataSource);
        }

        routing.setTargetDataSources(targetDataSources);
        routing.setDefaultTargetDataSource(mainDbDataSource);
        return routing;
    }

}
