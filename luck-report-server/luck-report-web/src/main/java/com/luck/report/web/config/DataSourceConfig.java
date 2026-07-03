package com.luck.report.web.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;

/**
 * 主数据源配置（MySQL / Oracle / DM 等关系型主库）
 *
 * 默认行为：从 spring.datasource.* 读取连接信息，构建 HikariCP DataSource
 *
 * 为什么不依赖 Spring Boot 自动装配的 DataSourceTransactionManager / TransactionTemplate？
 *   - pgsql vector plugin 自带 vectorDataSource DataSource Bean
 *   - 容器里会有 2 个 DataSource Bean，都不带 @Primary
 *   - DataSourceTransactionManagerAutoConfiguration 用 @ConditionalOnSingleCandidate，
 *     多 DataSource 无 @Primary → 条件失败 → 不会自动建 TransactionManager
 *   - 链路：TransactionTemplate 也无法自动建 → 业务 Service 构造函数注入 TransactionTemplate 失败
 *   - 解决：显式建 mainDbTransactionManager + transactionTemplate，绑定 mainDbDataSource
 *
 * 多数据源 starter 接入（如 dynamic-datasource-spring-boot-starter）：
 *   - 用户改用 spring.datasource.dynamic.* 格式后，spring.datasource.url 不再设置
 *   - mainDbDataSource 不创建 → 整个 TransactionConfig 不加载（外层 @ConditionalOnBean 兜底）
 *   - 3rd 方 starter 的 DataSource Bean（通常名为 "dataSource"）成为唯一 DataSource
 *   - 3rd 方 starter 自带事务管理器 / TransactionTemplate
 *   - 用户设置 luck-report.mybatis.primary-datasource=dataSource 让 MyBatis 走它
 *
 * @author luck
 */
@Slf4j
@Configuration
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceConfig {

    @Bean(name = "mainDbDataSource")
    @ConditionalOnMissingBean(name = "mainDbDataSource")
    @ConditionalOnProperty(name = "spring.datasource.url")
    public DataSource mainDbDataSource(DataSourceProperties springDataSourceProperties) {
        log.info("[DataSourceConfig] mainDbDataSource Bean 开始创建, url={}", springDataSourceProperties.getUrl());
        return springDataSourceProperties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }
}
