package com.luck.report.agent.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * MyBatis Mapper 扫描配置
 * 配置指定包路径下的 Mapper 接口扫描，关联到已存在的 sqlSessionFactory
 *
 * @author luck
 */
@Configuration
@MapperScan(basePackages = {
        "com.luck.report.agent.modules.chat.mapper",
        "com.luck.report.agent.modules.vector.mapper",
        "com.luck.report.agent.modules.modelConfig.mapper",
        "com.luck.report.agent.modules.businessKnowledgeConfig.mapper",
        "com.luck.report.agent.modules.datasource.mapper",
        "com.luck.report.agent.modules.agentKnowledgeConfig.mapper"},
        sqlSessionFactoryRef = "sqlSessionFactory")
public class ReportMyBatisConfig {

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
        bean.setTypeAliasesPackage("com.luck.report.agent.domain.entity");

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        bean.setConfiguration(configuration);

        return bean.getObject();
    }
}
