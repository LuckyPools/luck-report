package com.luck.agent.config;

import com.luck.agent.domain.dto.DataSourceItem;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
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
 * - pgVectorDataSource：PostgreSQL 向量存储数据源，从 luck-report.datasource.pgvector.* 读取配置
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
@MapperScan(basePackages = {
        "com.luck.agent.modules.chat.mapper",
        "com.luck.agent.modules.vector.mapper",
        "com.luck.agent.modules.modelConfig.mapper",
        "com.luck.agent.modules.businessKnowledgeConfig.mapper"},
        sqlSessionFactoryRef = "sqlSessionFactory")
public class DynamicDataSourceConfig {

    @Autowired
    private DataSourceProperties dataSourceProperties;

    @Autowired
    private org.springframework.boot.autoconfigure.jdbc.DataSourceProperties springDataSourceProperties;

    /**
     * 主数据源（HikariCP）
     * 从标准 spring.datasource.* 配置创建，供 ChatSessionMapper 等默认 Mapper 使用
     *
     * @return MySQL HikariDataSource
     */
    @Bean(name = "mainDbDataSource")
    public DataSource mainDbDataSource() {
        return springDataSourceProperties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    /**
     * PostgreSQL 向量存储数据源（HikariCP）
     * 从 luck-report.datasource.pgvector.* 读取配置
     *
     * @return PostgreSQL HikariDataSource
     */
    @Bean(name = "pgVectorDataSource")
    public DataSource pgVectorDataSource() {
        DataSourceItem item = dataSourceProperties.getPgvector();
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(item.getUrl());
        config.setUsername(item.getUsername());
        config.setPassword(item.getPassword());
        config.setDriverClassName(item.getDriverClassName());
        config.setMaximumPoolSize(item.getMaximumPoolSize());
        config.setPoolName("pgvector-pool");
        return new HikariDataSource(config);
    }

    /**
     * 动态路由数据源
     * 根据 DataSourceContextHolder 中的标识选择目标数据源
     * 默认指向主数据源，@DataSource("pgvector") 注解可切换到 pgvector
     *
     * @param mainDbDataSource   主数据源（来自 spring.datasource.*）
     * @param pgVectorDataSource PostgreSQL 向量存储数据源
     * @return 路由数据源
     */
    @Bean(name = "dynamicDataSource")
    @Primary
    public DataSource dynamicDataSource(@Qualifier("mainDbDataSource") DataSource mainDbDataSource,
                                        @Qualifier("pgVectorDataSource") DataSource pgVectorDataSource) {
        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                return DataSourceContextHolder.get();
            }
        };

        Map<Object, Object> targetDataSources = new HashMap<>(2);
        targetDataSources.put(DataSourceContextHolder.DEFAULT, mainDbDataSource);
        targetDataSources.put(DataSourceContextHolder.PGVECTOR, pgVectorDataSource);

        routing.setTargetDataSources(targetDataSources);
        routing.setDefaultTargetDataSource(mainDbDataSource);
        return routing;
    }

    /**
     * MyBatis SqlSessionFactory
     * 注入动态路由数据源，使 MyBatis 的 Mapper 支持 @DataSource 切换
     *
     * @param dynamicDataSource 动态路由数据源
     * @return SqlSessionFactory
     * @throws Exception 配置异常
     */
    @Bean(name = "sqlSessionFactory")
    public SqlSessionFactory sqlSessionFactory(@Qualifier("dynamicDataSource") DataSource dynamicDataSource) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dynamicDataSource);
        bean.setTypeAliasesPackage("com.luck.agent.domain.entity");

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        bean.setConfiguration(configuration);

        return bean.getObject();
    }
}
