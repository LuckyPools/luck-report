package com.luck.report.agent.config;

import org.apache.ibatis.mapping.DatabaseIdProvider;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
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
        "com.luck.report.agent.modules.chat.mapper",
        "com.luck.report.agent.modules.modelConfig.mapper",
        "com.luck.report.agent.modules.businessKnowledgeConfig.mapper",
        "com.luck.report.agent.modules.datasource.mapper",
        "com.luck.report.agent.modules.agentKnowledgeConfig.mapper"},
        sqlSessionFactoryRef = "sqlSessionFactory")
public class ReportMyBatisConfig {

    /**
     * 数据库类型识别提供者
     * 根据 JDBC 连接的 DatabaseMetaData 自动识别当前数据库类型（mysql/oracle/postgresql等），
     * MyBatis 据此匹配 XML mapper 中 databaseId 属性对应的 SQL 语句
     *
     * @return DatabaseIdProvider 实例
     */
    @Bean
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
     * 注入动态路由数据源，使 MyBatis 的 Mapper 支持 @DataSource 切换
     * 配置 mapperLocations 扫描 mapper/{databaseId}/ 目录下的 XML 文件，
     * 配合 DatabaseIdProvider 实现多数据库 SQL 路由
     *
     * @param dynamicDataSource  动态路由数据源
     * @param databaseIdProvider 数据库类型识别提供者
     * @return SqlSessionFactory
     * @throws Exception 配置异常
     */
    @Bean(name = "sqlSessionFactory")
    public SqlSessionFactory sqlSessionFactory(@Qualifier("dynamicDataSource") DataSource dynamicDataSource,
                                               DatabaseIdProvider databaseIdProvider) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dynamicDataSource);
        bean.setDatabaseIdProvider(databaseIdProvider);
        bean.setTypeAliasesPackage("com.luck.report.agent.domain.entity");

        // 根据数据库类型动态选择 mapper 目录，避免多库 XML 同名 statement 冲突
        String databaseId = databaseIdProvider.getDatabaseId(dynamicDataSource);
        String mapperPath = "classpath*:mapper/" + (databaseId != null ? databaseId : "mysql") + "/**/*.xml";
        bean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources(mapperPath));

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        bean.setConfiguration(configuration);

        // 注册分页拦截器，自动根据数据库方言改写分页 SQL
        bean.setPlugins(new PaginationInterceptor());

        return bean.getObject();
    }
}
