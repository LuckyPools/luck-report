package com.luck.report.web.config;

import org.apache.ibatis.mapping.DatabaseIdProvider;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;
import java.util.Properties;

/**
 * MyBatis Mapper 扫描配置
 * 配置指定包路径下的 Mapper 接口扫描，关联到已存在的 sqlSessionFactory
 * 支持多数据库方言：通过 DatabaseIdProvider 自动识别数据库类型，
 * 加载 mapper/{databaseId}/ 目录下对应的 XML 文件实现多库兼容
 *
 * @author luck
 */
@Configuration
@MapperScan(basePackages = {
        "com.luck.report.web.modules.chat.mapper",
        "com.luck.report.web.modules.modelConfig.mapper",
        "com.luck.report.web.modules.businessKnowledgeConfig.mapper",
        "com.luck.report.web.modules.datasource.mapper",
        "com.luck.report.web.modules.agentKnowledgeConfig.mapper",
        "com.luck.report.web.modules.role.mapper",
        "com.luck.report.web.modules.file.mapper"},
        sqlSessionFactoryRef = "bean.sqlSessionFactory")
public class ReportMyBatisConfig {

    /**
     * 数据库类型识别提供者
     * 根据 JDBC 连接的 DatabaseMetaData 自动识别当前数据库类型（mysql/oracle/postgresql等），
     * MyBatis 据此匹配 XML mapper 中 databaseId 属性对应的 SQL 语句
     *
     * @return DatabaseIdProvider 实例
     */
    @Bean(name = "bean.databaseIdProvider")
    public DatabaseIdProvider databaseIdProvider() {
        org.apache.ibatis.mapping.VendorDatabaseIdProvider provider = new org.apache.ibatis.mapping.VendorDatabaseIdProvider();
        Properties properties = new Properties();
        properties.setProperty("Oracle", "oracle");
        properties.setProperty("MySQL", "mysql");
        properties.setProperty("SQL Server", "sqlserver");
        properties.setProperty("PostgreSQL", "postgresql");
        properties.setProperty("DM", "dm");
        provider.setProperties(properties);
        return provider;
    }

    /**
     * MyBatis SqlSessionFactory
     * 注入主数据源 Bean，bean 名由 luck-report.mybatis.primary-datasource 配置项控制
     *   默认 "mainDbDataSource"（DataSourceConfig 提供的 @Primary 主库）
     *   接入 3rd 方多数据源 starter 时设为 "dataSource"（starter 默认 Bean 名）
     * 配置 mapperLocations 扫描 mapper/{databaseId}/ 目录下的 XML 文件，
     * 配合 DatabaseIdProvider 实现多数据库 SQL 路由
     *
     * @param dataSourceBeanName 主数据源 Bean 名（从 luck-report.mybatis.primary-datasource 读取）
     * @param beanFactory        BeanFactory 用于按名查找主数据源
     * @param databaseIdProvider 数据库类型识别提供者
     * @return SqlSessionFactory
     * @throws Exception 配置异常
     */
    @Bean(name = "bean.sqlSessionFactory")
    public SqlSessionFactory sqlSessionFactory(
            @Value("${luck-report.mybatis.primary-datasource:mainDbDataSource}") String dataSourceBeanName,
            BeanFactory beanFactory,
            DatabaseIdProvider databaseIdProvider) throws Exception {
        DataSource dataSource = beanFactory.getBean(dataSourceBeanName, DataSource.class);

        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource);
        bean.setDatabaseIdProvider(databaseIdProvider);
        bean.setTypeAliasesPackage("com.luck.report.web.domain.entity");

        // 根据数据库类型动态选择 mapper 目录，避免多库 XML 同名 statement 冲突
        String databaseId = databaseIdProvider.getDatabaseId(dataSource);
        String mapperPath = "classpath*:mapper/" + (databaseId != null ? databaseId : "mysql") + "/**/*.xml";
        bean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources(mapperPath));

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        bean.setConfiguration(configuration);

        return bean.getObject();
    }
}
