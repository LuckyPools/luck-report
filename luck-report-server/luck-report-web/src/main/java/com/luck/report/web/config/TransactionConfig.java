package com.luck.report.web.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;

/**
     * 主库事务配置（嵌套类）
     * 外层 @ConditionalOnBean(name = "mainDbDataSource") 兜底：
     *   - mainDbDataSource 存在 → 加载本类，建 mainDbTransactionManager + transactionTemplate
     *   - mainDbDataSource 不存在（如 3rd 方 starter 场景）→ 整个类不加载，不会有空指针
 * @author luckyPools
 */
@Slf4j
@Configuration
@ConditionalOnBean(name = "mainDbDataSource")
public  class TransactionConfig {

    @Bean(name = "mainDbTransactionManager")
    @ConditionalOnMissingBean(name = "mainDbTransactionManager")
    public DataSourceTransactionManager mainDbTransactionManager(
            @Qualifier("mainDbDataSource") DataSource mainDbDataSource) {
        log.info("[TransactionConfig] mainDbTransactionManager Bean 开始创建, dataSource={}", mainDbDataSource);
        return new DataSourceTransactionManager(mainDbDataSource);
    }

    @Bean(name = "bean.transactionTemplate")
    @ConditionalOnMissingBean(name = "bean.transactionTemplate")
    public TransactionTemplate transactionTemplate(
            @Qualifier("mainDbTransactionManager") PlatformTransactionManager mainDbTransactionManager) {
        log.info("[TransactionConfig] transactionTemplate Bean 开始创建, transactionManager={}", mainDbTransactionManager);
        return new TransactionTemplate(mainDbTransactionManager);
    }
}
